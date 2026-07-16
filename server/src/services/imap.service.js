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
const { readDmarcReport, looksLikeDmarcReport } = require('./helpers/dmarc-report');

const _cache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

// File types that should be flagged as potentially unsafe
const UNSAFE_EXTS = new Set(['.exe','.bat','.cmd','.ps1','.vbs','.jar','.msi','.scr','.pif','.com','.hta','.wsf','.lnk','.dll','.reg']);

function isSuspicious(filename = '', contentType = '') {
  const ext = (filename.toLowerCase().match(/\.[^.]+$/) || [''])[0];
  return UNSAFE_EXTS.has(ext)
    || contentType.includes('application/x-msdownload')
    || contentType.includes('application/x-executable')
    || contentType.includes('application/x-dosexec');
}

function imapConfig(deptKey) {
  const dept = DEPARTMENTS[deptKey];
  if (!dept || !dept.user || !dept.pass) return null;
  return {
    host: process.env.IMAP_HOST || process.env.SMTP_HOST || 'mail.jyotishstack.com',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_SECURE !== 'false',
    auth: { user: dept.user, pass: dept.pass },
    tls: {
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

/** Invalidate cache for a dept+folder */
function invalidateCache(deptKey, folder = 'INBOX') {
  delete _cache[`${deptKey}:${folder}`];
}

async function withClient(deptKey, fn) {
  if (!ImapFlow) throw new Error('imapflow not installed — run npm install in server/');
  const cfg = imapConfig(deptKey);
  if (!cfg) throw new Error(`Department ${deptKey} IMAP not configured`);
  const client = new ImapFlow(cfg);
  try {
    await client.connect();
    return await fn(client);
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

/**
 * Fetch email summaries from a department's mailbox.
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
    if (total === 0) { await client.logout(); return []; }

    const start = Math.max(1, total - limit + 1);
    const lock = await client.getMailboxLock(folder);
    try {
      for await (const msg of client.fetch(`${start}:*`, {
        envelope: true, uid: true, flags: true,
      })) {
        const fromAddress = msg.envelope.from?.[0]?.address || '';
        const subject = msg.envelope.subject || '(no subject)';
        msgs.push({
          uid:     msg.uid,
          dept:    deptKey,
          from:    msg.envelope.from?.[0] ? {
            name:    msg.envelope.from[0].name    || '',
            address: fromAddress,
          } : null,
          to:      msg.envelope.to?.[0]?.address || '',
          subject,
          date:    msg.envelope.date,
          seen:    msg.flags?.has('\\Seen')    ?? true,
          starred: msg.flags?.has('\\Flagged') ?? false,
          folder,
          // Flag automated DMARC reports so the list can label them rather than
          // showing a daily subject-only row that looks like an empty message.
          // Judged on the envelope alone — this listing deliberately does not
          // download bodies, and paying that cost to label a badge would slow
          // every inbox load for every user.
          is_dmarc: looksLikeDmarcReport({ from: fromAddress, subject, attachments: [] }),
        });
      }
    } finally { lock.release(); }
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
 * Fetch starred (\\Flagged) messages across a department's inbox.
 */
async function fetchStarred(deptKey, folder = 'INBOX') {
  return withClient(deptKey, async (client) => {
    const lock = await client.getMailboxLock(folder);
    const msgs = [];
    try {
      const uids = await client.search({ flagged: true }, { uid: true });
      if (!uids || uids.length === 0) return [];
      for await (const msg of client.fetch(uids, {
        envelope: true, uid: true, flags: true,
      }, { uid: true })) {
        msgs.push({
          uid:     msg.uid,
          dept:    deptKey,
          from:    msg.envelope.from?.[0] ? {
            name:    msg.envelope.from[0].name    || '',
            address: msg.envelope.from[0].address || '',
          } : null,
          to:      msg.envelope.to?.[0]?.address || '',
          subject: msg.envelope.subject || '(no subject)',
          date:    msg.envelope.date,
          seen:    msg.flags?.has('\\Seen')    ?? true,
          starred: true,
          folder,
        });
      }
    } finally { lock.release(); }
    return msgs.reverse();
  });
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
      await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Seen'], { uid: true });
      const msg = await client.fetchOne(`${uid}`, { source: true, flags: true }, { uid: true });
      if (!msg) return null;

      const parsed = await simpleParser(msg.source);
      invalidateCache(deptKey, folder);

      return {
        uid:     Number(uid),
        dept:    deptKey,
        from:    parsed.from?.text || '',
        to:      parsed.to?.text   || '',
        cc:      parsed.cc?.text   || '',
        subject: parsed.subject    || '(no subject)',
        date:    parsed.date,
        html:    parsed.html || null,
        text:    parsed.text || '',
        starred: msg.flags?.has('\\Flagged') ?? false,
        attachments: (parsed.attachments || []).map((a, i) => ({
          index:       i,
          filename:    a.filename || `attachment_${i}`,
          size:        a.size     || 0,
          contentType: a.contentType || 'application/octet-stream',
          isImage:     (a.contentType || '').startsWith('image/'),
          // Embed small images (< 2 MB) as base64 for inline preview
          preview:     (a.contentType || '').startsWith('image/') && (a.size || 0) < 2097152
                         ? `data:${a.contentType};base64,${a.content.toString('base64')}`
                         : null,
          suspicious:  isSuspicious(a.filename, a.contentType),
        })),
        // DMARC aggregate reports arrive daily with an empty body and their whole
        // payload zipped in an attachment, so they read as junk. Decode them here,
        // where the attachment buffers are still in hand, and hand the UI a
        // summary instead of a file to download and open by hand. Null for every
        // other message, which is the overwhelming majority.
        dmarc: readDmarcReport(parsed),
      };
    } finally { lock.release(); }
  } finally {
    try { await client.logout(); } catch (_) {}
  }
}

/**
 * Mark a message as read or unread.
 */
async function markSeen(deptKey, uid, seen = true, folder = 'INBOX') {
  await withClient(deptKey, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      if (seen) {
        await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Seen'], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: Number(uid) }, ['\\Seen'], { uid: true });
      }
    } finally { lock.release(); }
  });
  invalidateCache(deptKey, folder);
}

/**
 * Star or un-star a message (\\Flagged IMAP flag).
 */
async function toggleStar(deptKey, uid, starred = true, folder = 'INBOX') {
  await withClient(deptKey, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      if (starred) {
        await client.messageFlagsAdd({ uid: Number(uid) }, ['\\Flagged'], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: Number(uid) }, ['\\Flagged'], { uid: true });
      }
    } finally { lock.release(); }
  });
  invalidateCache(deptKey, folder);
}

/**
 * Delete a message (moves to Trash if server supports it, otherwise expunges).
 */
async function deleteMessage(deptKey, uid, folder = 'INBOX') {
  await withClient(deptKey, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageDelete({ uid: Number(uid) }, { uid: true });
    } finally { lock.release(); }
  });
  invalidateCache(deptKey, folder);
}

/**
 * Fetch raw attachment content for download.
 */
async function fetchAttachmentData(deptKey, uid, attachmentIndex, folder = 'INBOX') {
  return withClient(deptKey, async (client) => {
    const lock = await client.getMailboxLock(folder);
    try {
      const msg = await client.fetchOne(`${uid}`, { source: true }, { uid: true });
      if (!msg) throw new Error('Message not found');
      const parsed = await simpleParser(msg.source);
      const att = (parsed.attachments || [])[attachmentIndex];
      if (!att) throw new Error('Attachment not found');
      return {
        filename:    att.filename    || `attachment_${attachmentIndex}`,
        contentType: att.contentType || 'application/octet-stream',
        content:     att.content,
        size:        att.size || att.content?.length || 0,
        suspicious:  isSuspicious(att.filename, att.contentType),
      };
    } finally { lock.release(); }
  });
}

module.exports = {
  fetchMailbox,
  fetchStarred,
  fetchEmail,
  markSeen,
  toggleStar,
  deleteMessage,
  fetchAttachmentData,
  invalidateCache,
};
