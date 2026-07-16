'use strict';
/**
 * DMARC aggregate report reader.
 *
 * Mailbox providers send one report per day to whatever address the domain's
 * DMARC record names in `rua=`. The mail itself is deliberately empty — the whole
 * report is a compressed XML attachment — so an inbox shows a daily "(empty body)"
 * message that looks like junk while actually carrying the only routine evidence
 * of whether anyone is forging mail from the domain, and whether the domain's own
 * mail is authenticating.
 *
 * This turns that attachment into a sentence a human can act on.
 *
 * Reading it needs no new dependency:
 *  - Google/Yahoo ship the XML as .zip or .gz. gzip is `zlib` (built in); ZIP is
 *    just a container around raw DEFLATE, which `zlib.inflateRawSync` handles —
 *    the container itself is parsed below.
 *  - The XML is machine-generated with a fixed, shallow schema, so it is read with
 *    scoped tag extraction rather than a full parser. Every lookup is bounded to
 *    its parent element, because `<dkim>` legitimately appears in two different
 *    places with different meanings.
 */

const zlib = require('zlib');

// ── Detection ────────────────────────────────────────────────────────────────
const DMARC_FILENAME = /\.(zip|gz|xml)$/i;
const DMARC_SENDERS = /(dmarc|noreply-dmarc|postmaster)/i;

/**
 * Is this attachment a DMARC aggregate report?
 * Providers name them `<reporter>!<domain>!<start>!<end>.zip`, which is the
 * strongest signal available — content types are inconsistent between providers
 * (application/zip, application/gzip, application/octet-stream all occur).
 */
function isDmarcAttachment(filename = '', contentType = '') {
  const f = String(filename || '');
  if (!DMARC_FILENAME.test(f)) return false;
  // The `!`-delimited name is specific to aggregate reports.
  if (f.includes('!')) return true;
  return /dmarc/i.test(f) || /dmarc/i.test(String(contentType || ''));
}

/** Does this message look like a DMARC report at all? Cheap pre-filter. */
function looksLikeDmarcReport({ from = '', subject = '', attachments = [] } = {}) {
  const hasAttachment = (attachments || []).some((a) => isDmarcAttachment(a.filename, a.contentType));
  if (hasAttachment) return true;
  return DMARC_SENDERS.test(from) && /report domain/i.test(subject);
}

// ── Decompression ────────────────────────────────────────────────────────────
/**
 * Extract the single file from a ZIP archive.
 *
 * Read via the central directory rather than the local header: when a writer sets
 * the data-descriptor flag, the local header's compressed size is zero and only
 * the central directory has the real value. Aggregate reports always contain
 * exactly one entry.
 */
function unzipFirstEntry(buf) {
  const EOCD_SIG = 0x06054b50;
  const CDFH_SIG = 0x02014b50;
  const LFH_SIG = 0x04034b50;

  // End-of-central-directory lives in the last 22 bytes + up to 64K of comment.
  let eocd = -1;
  const floor = Math.max(0, buf.length - 22 - 65535);
  for (let i = buf.length - 22; i >= floor; i -= 1) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) return null;

  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset + 46 > buf.length || buf.readUInt32LE(cdOffset) !== CDFH_SIG) return null;

  const method = buf.readUInt16LE(cdOffset + 10);
  const compSize = buf.readUInt32LE(cdOffset + 20);
  const localOffset = buf.readUInt32LE(cdOffset + 42);
  if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== LFH_SIG) return null;

  const nameLen = buf.readUInt16LE(localOffset + 26);
  const extraLen = buf.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + nameLen + extraLen;
  const data = buf.subarray(start, start + compSize);

  if (method === 0) return data;                 // stored
  if (method === 8) return zlib.inflateRawSync(data);   // deflate
  return null;
}

/** Decompress a report attachment to its XML text. Returns null if unreadable. */
function extractXml(buffer, filename = '') {
  if (!buffer || !buffer.length) return null;
  try {
    // Sniff by magic bytes — filenames lie, and some providers gzip a `.zip` name.
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) return zlib.gunzipSync(buffer).toString('utf8');
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      const out = unzipFirstEntry(buffer);
      return out ? out.toString('utf8') : null;
    }
    if (/\.xml$/i.test(filename) || buffer.subarray(0, 5).toString() === '<?xml') return buffer.toString('utf8');
  } catch {
    return null;   // corrupt archive — the caller degrades to the raw attachment
  }
  return null;
}

// ── XML reading (scoped, no dependency) ──────────────────────────────────────
const inner = (xml, name) => {
  const m = String(xml || '').match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : null;
};
const value = (xml, name) => {
  const v = inner(xml, name);
  return v == null ? null : v.replace(/<[^>]*>/g, '').trim() || null;
};
const all = (xml, name) => [...String(xml || '').matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => m[1]);

/**
 * Parse a DMARC aggregate report.
 *
 * `policy_evaluated`'s dkim/spf are the ALIGNED results — the ones DMARC actually
 * judges on — and are deliberately read from inside that element only. The
 * `auth_results` block further down also contains <dkim>/<spf> tags with the raw,
 * unaligned outcome; reading those by accident would report a pass where DMARC saw
 * a failure.
 */
function parseDmarcXml(xml) {
  if (!xml || !/<feedback/i.test(xml)) return null;

  const meta = inner(xml, 'report_metadata') || '';
  const range = inner(meta, 'date_range') || '';
  const policy = inner(xml, 'policy_published') || '';

  const records = all(xml, 'record').map((rec) => {
    const row = inner(rec, 'row') || '';
    const evaluated = inner(row, 'policy_evaluated') || '';
    const dkim = value(evaluated, 'dkim');
    const spf = value(evaluated, 'spf');
    return {
      source_ip: value(row, 'source_ip'),
      count: Number(value(row, 'count') || 0),
      disposition: value(evaluated, 'disposition'),
      dkim,
      spf,
      header_from: value(inner(rec, 'identifiers') || '', 'header_from'),
      // DMARC passes when EITHER mechanism passes AND aligns — not both.
      passed: dkim === 'pass' || spf === 'pass',
    };
  });

  const epoch = (v) => (v ? new Date(Number(v) * 1000).toISOString() : null);

  return {
    org: value(meta, 'org_name'),
    report_id: value(meta, 'report_id'),
    begin: epoch(value(range, 'begin')),
    end: epoch(value(range, 'end')),
    domain: value(policy, 'domain'),
    policy: {
      p: value(policy, 'p'),
      sp: value(policy, 'sp'),
      pct: value(policy, 'pct'),
      adkim: value(policy, 'adkim'),
      aspf: value(policy, 'aspf'),
    },
    records,
  };
}

/**
 * Reduce a parsed report to what a human needs to know:
 * did anything fail, and was any of it someone else?
 */
function summarizeDmarc(parsed) {
  if (!parsed) return null;
  const records = parsed.records || [];
  const total = records.reduce((s, r) => s + r.count, 0);
  const passed = records.filter((r) => r.passed).reduce((s, r) => s + r.count, 0);
  const failed = total - passed;

  const failing = records.filter((r) => !r.passed)
    .sort((a, b) => b.count - a.count)
    .map((r) => ({ ip: r.source_ip, count: r.count, dkim: r.dkim, spf: r.spf, disposition: r.disposition }));

  return {
    ...parsed,
    total,
    passed,
    failed,
    all_passed: total > 0 && failed === 0,
    // No mail at all is not "everything passed" — it means nothing was reported.
    empty: total === 0,
    failing_sources: failing.slice(0, 10),
    source_count: records.length,
  };
}

/**
 * Read the DMARC report out of a parsed email, if it is one.
 * @param {object} parsedEmail  mailparser output ({ from, subject, attachments })
 * @returns {object|null} summary, or null when this is not a readable report
 */
function readDmarcReport(parsedEmail) {
  if (!parsedEmail) return null;
  const attachments = parsedEmail.attachments || [];
  const att = attachments.find((a) => isDmarcAttachment(a.filename, a.contentType));
  if (!att || !att.content) return null;

  const xml = extractXml(att.content, att.filename);
  if (!xml) return null;

  const parsed = parseDmarcXml(xml);
  if (!parsed) return null;
  return summarizeDmarc(parsed);
}

module.exports = {
  isDmarcAttachment, looksLikeDmarcReport, extractXml, unzipFirstEntry,
  parseDmarcXml, summarizeDmarc, readDmarcReport,
};
