/**
 * IMAP service — reads emails from department mailboxes using imapflow.
 * Falls back gracefully if imapflow is not installed or IMAP is not configured.
 * Cache: 60-second in-memory cache per (dept, folder) to avoid hammering the server.
 */

let ImapFlow;
try { ImapFlow = require('imapflow').ImapFlow; } catch (_) { /* optional dep */ }

let simpleParser;
try { simpleParser = require('mailparser').simpleParser; } catch (_) { /* optional dep */ }

const { DEPARTMENTS } = require('./email.service');

const _cache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

function imapConfig(deptKey) {
  const dept = DEPARTMENTS[deptKey];
  if (!dept || !dept.user || !dept.pass) return null;
  // Self-hosted mail (Postfix/Dovecot/OpenDKIM) runs SMTP + IMAP on the SAME host:
  // mail.jyotishstack.com. Dovecot listens on 993 (imaps, ssl=required). So the
  // IMAP host defaults to SMTP_HOST and only falls back to the mail subdomain —
  // never an external provider.
  return {
    host: process.env.IMAP_HOST || process.env.SMTP_HOST || 'mail.jyotishstack.com',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_SECURE !== 'false', // 993 = implicit TLS
    auth: { user: dept.user, pass: dept.pass },
    tls: {
      // Match the SMTP TLS posture used by email.service.js (self-signed-safe via env)
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      servername: process.env.SMTP_TLS_SERVERNAME || process.env.IMAP_HOST || process.env.SMTP_HOST || 'mail.jyotishstack.com',
    },
    logger: false,
    disableAutoIdle: true,
    socketTimeout: 15000,
    greetingTimeout: 10000,
    connectionTimeout: 12000,
  };
}

/**
 * Fetch email summaries from a department's mailbox.
 * @param {string} deptKey - 'sales' | 'team' | 'account'
 * @param {string} folder  - IMAP folder name, default 'INBOX'
 * @param {number} limit   - max messages to return
 */
async function fetchMailbox(deptKey, folder = 'INBOX', limit = 50) {
  if (!ImapFlow) throw new Error('imapflow not installed — run npm install in server/');

  const cacheKey = `${deptKey}:${folder}`;
  const hit = _cache[cacheKey];
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const cfg = imapConfig(deptKey);
  if (!cfg) return [];

  const client = new ImapFlow(cfg);
  const msgs = [];

  try {
    await client.connect();
    const status = await client.status(folder, { messages: true });
    const total = status.messages || 0;
    if (total === 0) {
      await client.logout();
      return [];
    }

    const start = Math.max(1, total - limit + 1);
    const lock = await client.getMailboxLock(folder);
    try {
      for await (const msg of client.fetch(`${start}:*`, {
        envelope: true,
        uid: true,
        flags: true,
      })) {
        msgs.push({
          uid:     msg.uid,
          dept:    deptKey,
          from:    msg.envelope.from?.[0] ? {
            name:    msg.envelope.from[0].name || '',
            address: msg.envelope.from[0].address || '',
          } : null,
          to: msg.envelope.to?.[0]?.address || '',
          subject: msg.envelope.subject || '(no subject)',
          date:    msg.envelope.date,
          seen:    msg.flags?.has('\\Seen') ?? true,
          folder,
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    try { await client.logout(); } catch (_) {}
    throw err;
  }

  msgs.reverse(); // newest first
  _cache[cacheKey] = { ts: Date.now(), data: msgs };
  return msgs;
}

/**
 * Fetch and fully parse a single email by UID.
 */
async function fetchEmail(deptKey, uid, folder = 'INBOX') {
  if (!ImapFlow || !simpleParser) throw new Error('imapflow/mailparser not installed');

  const cfg = imapConfig(deptKey);
  if (!cfg) throw new Error('Department IMAP not configured');

  const client = new ImapFlow(cfg);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      // Mark as seen
      await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Seen'], { uid: true });
      const msg = await client.fetchOne(`${uid}`, { source: true }, { uid: true });
      if (!msg) return null;

      const parsed = await simpleParser(msg.source);

      // Invalidate the list cache so "seen" status refreshes
      delete _cache[`${deptKey}:${folder}`];

      return {
        uid:         Number(uid),
        dept:        deptKey,
        from:        parsed.from?.text || '',
        to:          parsed.to?.text   || '',
        cc:          parsed.cc?.text   || '',
        subject:     parsed.subject    || '(no subject)',
        date:        parsed.date,
        html:        parsed.html || null,
        text:        parsed.text || '',
        attachments: (parsed.attachments || []).map(a => ({
          filename:    a.filename,
          size:        a.size,
          contentType: a.contentType,
        })),
      };
    } finally {
      lock.release();
    }
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

/** Invalidate cache for a dept+folder (call after compose/send to a dept) */
function invalidateCache(deptKey, folder = 'INBOX') {
  delete _cache[`${deptKey}:${folder}`];
}

module.exports = { fetchMailbox, fetchEmail, invalidateCache };
