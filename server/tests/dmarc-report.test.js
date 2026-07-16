'use strict';
/**
 * DMARC aggregate report reader.
 *
 * The parser is hand-rolled (no XML or ZIP dependency), so these tests carry the
 * weight a library's own test-suite normally would: a real Google-shaped report,
 * built into a real ZIP, read back end to end.
 */

const test = require('node:test');
const assert = require('node:assert');
const zlib = require('zlib');

const {
  isDmarcAttachment, looksLikeDmarcReport, extractXml,
  parseDmarcXml, summarizeDmarc, readDmarcReport,
} = require('../src/services/helpers/dmarc-report');

// A real Google aggregate-report shape: one aligned sender, one forged sender.
// Note both <policy_evaluated><dkim> and <auth_results><dkim> are present with
// DIFFERENT values — that is the trap the parser must not fall into.
const XML = `<?xml version="1.0" encoding="UTF-8" ?>
<feedback>
  <report_metadata>
    <org_name>google.com</org_name>
    <email>noreply-dmarc-support@google.com</email>
    <report_id>1496345015732540418</report_id>
    <date_range><begin>1752537600</begin><end>1752623999</end></date_range>
  </report_metadata>
  <policy_published>
    <domain>jyotishstack.com</domain>
    <adkim>r</adkim><aspf>r</aspf>
    <p>none</p><sp>none</sp><pct>100</pct>
  </policy_published>
  <record>
    <row>
      <source_ip>203.0.113.10</source_ip>
      <count>12</count>
      <policy_evaluated><disposition>none</disposition><dkim>pass</dkim><spf>pass</spf></policy_evaluated>
    </row>
    <identifiers><header_from>jyotishstack.com</header_from></identifiers>
    <auth_results>
      <dkim><domain>jyotishstack.com</domain><result>pass</result></dkim>
      <spf><domain>jyotishstack.com</domain><result>pass</result></spf>
    </auth_results>
  </record>
  <record>
    <row>
      <source_ip>198.51.100.7</source_ip>
      <count>3</count>
      <policy_evaluated><disposition>none</disposition><dkim>fail</dkim><spf>fail</spf></policy_evaluated>
    </row>
    <identifiers><header_from>jyotishstack.com</header_from></identifiers>
    <auth_results>
      <dkim><domain>evil.example</domain><result>pass</result></dkim>
      <spf><domain>evil.example</domain><result>pass</result></spf>
    </auth_results>
  </record>
</feedback>`;

/** Build a real single-entry ZIP the way a reporter would. */
function makeZip(name, content) {
  const nameBuf = Buffer.from(name);
  const raw = Buffer.from(content);
  const deflated = zlib.deflateRawSync(raw);
  const crc = (() => {
    let c = ~0;
    for (const b of raw) {
      c ^= b;
      for (let i = 0; i < 8; i += 1) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
    }
    return ~c >>> 0;
  })();

  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0); lfh.writeUInt16LE(20, 4); lfh.writeUInt16LE(0, 6);
  lfh.writeUInt16LE(8, 8); lfh.writeUInt32LE(0, 10); lfh.writeUInt32LE(crc, 14);
  lfh.writeUInt32LE(deflated.length, 18); lfh.writeUInt32LE(raw.length, 22);
  lfh.writeUInt16LE(nameBuf.length, 26); lfh.writeUInt16LE(0, 28);

  const localOffset = 0;
  const cdfh = Buffer.alloc(46);
  cdfh.writeUInt32LE(0x02014b50, 0); cdfh.writeUInt16LE(20, 4); cdfh.writeUInt16LE(20, 6);
  cdfh.writeUInt16LE(0, 8); cdfh.writeUInt16LE(8, 10); cdfh.writeUInt32LE(0, 12);
  cdfh.writeUInt32LE(crc, 16); cdfh.writeUInt32LE(deflated.length, 20); cdfh.writeUInt32LE(raw.length, 24);
  cdfh.writeUInt16LE(nameBuf.length, 28); cdfh.writeUInt16LE(0, 30); cdfh.writeUInt16LE(0, 32);
  cdfh.writeUInt16LE(0, 34); cdfh.writeUInt16LE(0, 36); cdfh.writeUInt32LE(0, 38);
  cdfh.writeUInt32LE(localOffset, 42);

  const cdStart = lfh.length + nameBuf.length + deflated.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdfh.length + nameBuf.length, 12); eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([lfh, nameBuf, deflated, cdfh, nameBuf, eocd]);
}

const REPORT_NAME = 'google.com!jyotishstack.com!1752537600!1752623999.zip';

// ── Detection ───────────────────────────────────────────────────────────────
test('detects a DMARC report attachment by its reporter filename', () => {
  assert.ok(isDmarcAttachment(REPORT_NAME, 'application/zip'));
  assert.ok(isDmarcAttachment('yahoo.com!jyotishstack.com!123!456.xml.gz', 'application/gzip'));
  assert.ok(!isDmarcAttachment('invoice.pdf', 'application/pdf'));
  assert.ok(!isDmarcAttachment('photo.zip', 'application/zip'), 'a plain zip is not a DMARC report');
});

test('recognises a DMARC report message', () => {
  assert.ok(looksLikeDmarcReport({ from: 'noreply-dmarc-support@google.com', subject: 'Report domain: jyotishstack.com', attachments: [] }));
  assert.ok(looksLikeDmarcReport({ from: 'x@y.com', subject: 'hi', attachments: [{ filename: REPORT_NAME, contentType: 'application/zip' }] }));
  assert.ok(!looksLikeDmarcReport({ from: 'client@example.com', subject: 'Question about my kundli', attachments: [] }));
});

// ── Decompression ───────────────────────────────────────────────────────────
test('reads the XML out of a real ZIP archive', () => {
  const xml = extractXml(makeZip('report.xml', XML), REPORT_NAME);
  assert.ok(xml && xml.includes('<feedback>'), 'ZIP should decompress to the report XML');
  assert.ok(xml.includes('1496345015732540418'));
});

test('reads the XML out of a gzip archive', () => {
  const xml = extractXml(zlib.gzipSync(Buffer.from(XML)), 'r.xml.gz');
  assert.ok(xml && xml.includes('<feedback>'));
});

test('sniffs by magic bytes, not by filename — providers mislabel these', () => {
  // gzip content wearing a .zip name must still be read
  const xml = extractXml(zlib.gzipSync(Buffer.from(XML)), 'report.zip');
  assert.ok(xml && xml.includes('<feedback>'));
});

test('a corrupt archive degrades to null rather than throwing', () => {
  assert.strictEqual(extractXml(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]), 'x.zip'), null);
  assert.strictEqual(extractXml(Buffer.alloc(0), 'x.zip'), null);
  assert.strictEqual(extractXml(Buffer.from('not an archive'), 'x.zip'), null);
});

// ── Parsing ─────────────────────────────────────────────────────────────────
test('parses the report metadata and policy', () => {
  const p = parseDmarcXml(XML);
  assert.strictEqual(p.org, 'google.com');
  assert.strictEqual(p.report_id, '1496345015732540418');
  assert.strictEqual(p.domain, 'jyotishstack.com');
  assert.strictEqual(p.policy.p, 'none');
  assert.strictEqual(p.policy.pct, '100');
  assert.ok(p.begin.startsWith('2025-07-15') || p.begin.includes('T'), 'begin is an ISO timestamp');
});

test('reads dkim/spf from policy_evaluated, NOT from auth_results', () => {
  // The forged record has auth_results dkim=pass (for evil.example) but
  // policy_evaluated dkim=fail. Reading the wrong one reports a spoofed sender
  // as a legitimate pass — the exact error this report exists to catch.
  const p = parseDmarcXml(XML);
  const forged = p.records.find((r) => r.source_ip === '198.51.100.7');
  assert.strictEqual(forged.dkim, 'fail');
  assert.strictEqual(forged.spf, 'fail');
  assert.strictEqual(forged.passed, false);
});

test('DMARC passes when EITHER mechanism aligns', () => {
  const oneOf = XML.replace('<dkim>pass</dkim><spf>pass</spf>', '<dkim>fail</dkim><spf>pass</spf>');
  const p = parseDmarcXml(oneOf);
  assert.strictEqual(p.records[0].passed, true, 'SPF alone passing is a DMARC pass');
});

// ── Summary ─────────────────────────────────────────────────────────────────
test('summarises volume, pass/fail and the failing sources', () => {
  const s = summarizeDmarc(parseDmarcXml(XML));
  assert.strictEqual(s.total, 15);
  assert.strictEqual(s.passed, 12);
  assert.strictEqual(s.failed, 3);
  assert.strictEqual(s.all_passed, false);
  assert.strictEqual(s.source_count, 2);
  assert.strictEqual(s.failing_sources[0].ip, '198.51.100.7');
  assert.strictEqual(s.failing_sources[0].count, 3);
});

test('a clean report reports all_passed', () => {
  // Drop the forged record with a tempered match, so the removal cannot span from
  // the first <record> through to the second one's closing tag.
  const clean = XML.replace(/<record>(?:(?!<record>)[\s\S])*?198\.51\.100\.7(?:(?!<record>)[\s\S])*?<\/record>/, '');
  const s = summarizeDmarc(parseDmarcXml(clean));
  assert.strictEqual(s.source_count, 1, 'only the forged record should have been removed');
  assert.strictEqual(s.total, 12);
  assert.strictEqual(s.failed, 0);
  assert.strictEqual(s.all_passed, true);
});

test('no reported mail is "empty", never "all passed"', () => {
  const none = XML.replace(/<record>[\s\S]*<\/record>/, '');
  const s = summarizeDmarc(parseDmarcXml(none));
  assert.strictEqual(s.total, 0);
  assert.strictEqual(s.empty, true);
  assert.strictEqual(s.all_passed, false, 'zero mail must not be reported as a clean pass');
});

// ── End to end ──────────────────────────────────────────────────────────────
test('reads a report straight off a parsed email', () => {
  const summary = readDmarcReport({
    from: 'noreply-dmarc-support@google.com',
    subject: 'Report domain: jyotishstack.com Submitter: google.com',
    attachments: [{ filename: REPORT_NAME, contentType: 'application/zip', content: makeZip('r.xml', XML) }],
  });
  assert.ok(summary, 'the report should be readable end to end');
  assert.strictEqual(summary.org, 'google.com');
  assert.strictEqual(summary.total, 15);
  assert.strictEqual(summary.failed, 3);
});

test('a normal email yields no report', () => {
  assert.strictEqual(readDmarcReport({ from: 'a@b.com', subject: 'hello', attachments: [] }), null);
  assert.strictEqual(readDmarcReport({ from: 'a@b.com', subject: 'hi', attachments: [{ filename: 'cv.pdf', contentType: 'application/pdf', content: Buffer.from('x') }] }), null);
  assert.strictEqual(readDmarcReport(null), null);
});
