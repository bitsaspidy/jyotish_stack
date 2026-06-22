'use strict';
const PDFDocument = require('pdfkit');
const path        = require('path');

const PAGE_W = 595;
const PAGE_H = 842;

const FONTS_DIR    = path.join(__dirname, 'fonts');
const FONT_DEV_REG = path.join(FONTS_DIR, 'NotoSansDevanagari-Regular.ttf');
const FONT_DEV_BOL = path.join(FONTS_DIR, 'NotoSansDevanagari-Bold.ttf');

// Devanagari Unicode block U+0900–U+097F
function _isDev(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 0x0900 && cp <= 0x097F;
}

// Split a string into same-script segments: [{text, dev}]
// Latin/numbers/punctuation → dev=false  → Helvetica
// Devanagari characters     → dev=true   → Noto Sans Devanagari
function splitSegs(str) {
  const s = String(str ?? '');
  if (!s) return [];
  const segs = [];
  let cur = s[0];
  let curDev = _isDev(s[0]);
  for (let i = 1; i < s.length; i++) {
    const d = _isDev(s[i]);
    if (d !== curDev) { segs.push({ text: cur, dev: curDev }); cur = s[i]; curDev = d; }
    else cur += s[i];
  }
  segs.push({ text: cur, dev: curDev });
  return segs;
}

class PdfDocUnicode {
  constructor() {
    this._doc = new PDFDocument({
      size: [PAGE_W, PAGE_H], margin: 0, autoFirstPage: false,
      info: { Creator: 'Jyotish Stack AI' },
    });
    this._doc.registerFont('DevReg', FONT_DEV_REG);
    this._doc.registerFont('DevBol', FONT_DEV_BOL);
    this._chunks = [];
    this._doc.on('data', chunk => this._chunks.push(chunk));
  }

  // Resolve pdfkit font name for a segment
  _fn(dev, bold) {
    if (dev) return bold ? 'DevBol' : 'DevReg';
    return bold ? 'Helvetica-Bold' : 'Helvetica';
  }

  addPage() {
    this._doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
    return this;
  }

  // ── Graphics primitives ─────────────────────────────────────────────────────

  rect(x, y, w, h, color) {
    this._doc.save().fillColor(color).rect(x, y, w, h).fill().restore();
    return this;
  }

  rectStroke(x, y, w, h, color, lw = 1) {
    this._doc.save().strokeColor(color).lineWidth(lw).rect(x, y, w, h).stroke().restore();
    return this;
  }

  line(x1, y1, x2, y2, color, lw = 1) {
    this._doc.save().strokeColor(color).lineWidth(lw)
      .moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
    return this;
  }

  poly(points, color, lw = 1) {
    const d = this._doc;
    d.save().strokeColor(color).lineWidth(lw);
    points.forEach(([px, py], i) => (i === 0 ? d.moveTo(px, py) : d.lineTo(px, py)));
    d.closePath().stroke().restore();
    return this;
  }

  polyFill(points, color) {
    const d = this._doc;
    d.save().fillColor(color);
    points.forEach(([px, py], i) => (i === 0 ? d.moveTo(px, py) : d.lineTo(px, py)));
    d.closePath().fill().restore();
    return this;
  }

  circle(cx, cy, r, color, lw = 1, fill = false) {
    const d = this._doc;
    d.save();
    if (fill) d.fillColor(color).circle(cx, cy, r).fill();
    else      d.strokeColor(color).lineWidth(lw).circle(cx, cy, r).stroke();
    d.restore();
    return this;
  }

  // ── Text ────────────────────────────────────────────────────────────────────

  // Measure a single segment with its correct font (no visible output)
  _segW(text, size, bold, dev) {
    this._doc.font(this._fn(dev, bold)).fontSize(size);
    return this._doc.widthOfString(text);
  }

  // Total width of a (possibly mixed-script) string
  textWidth(str, size, bold = false) {
    if (!str) return 0;
    return splitSegs(String(str))
      .reduce((w, seg) => w + this._segW(seg.text, size, bold, seg.dev), 0);
  }

  // Render text with per-segment font switching.
  // align='right'|'center' + width shifts the start x; renders left-to-right.
  text(x, y, str, opts = {}) {
    if (!str) return this;
    const { size = 10, color = '#000000', bold = false, align = 'left', width: boxW = 0 } = opts;
    const segs = splitSegs(String(str));
    if (!segs.length) return this;

    // Compute starting x for non-left alignment
    let tx = x;
    if (boxW && align !== 'left') {
      const totalW = segs.reduce((w, s) => w + this._segW(s.text, size, bold, s.dev), 0);
      if (align === 'right')  tx = x + boxW - totalW;
      if (align === 'center') tx = x + (boxW - totalW) / 2;
    }

    const d = this._doc;
    d.save().fillColor(color);
    for (const seg of segs) {
      const fn = this._fn(seg.dev, bold);
      d.font(fn).fontSize(size).text(seg.text, tx, y, { lineBreak: false });
      tx += this._segW(seg.text, size, bold, seg.dev);
    }
    d.restore();
    return this;
  }

  // Word-wrap str into lines that fit within maxWidth
  wrap(str, maxWidth, size, bold = false) {
    if (!str) return [''];
    const words = String(str).split(' ');
    const lines = [];
    let line = '';
    for (const wd of words) {
      const next = line ? `${line} ${wd}` : wd;
      if (this.textWidth(next, size, bold) > maxWidth && line) {
        lines.push(line);
        line = wd;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  // Multi-line paragraph
  para(x, y, str, maxWidth, opts = {}) {
    const { size = 9, lineGap = 3.5 } = opts;
    const lines = this.wrap(str, maxWidth, size, opts.bold);
    lines.forEach((ln, i) => this.text(x, y + i * (size + lineGap), ln, { size, ...opts }));
    return lines.length * (size + lineGap);
  }

  // Returns Promise<Buffer>
  build() {
    return new Promise((resolve, reject) => {
      this._doc.on('end',   () => resolve(Buffer.concat(this._chunks)));
      this._doc.on('error', reject);
      this._doc.end();
    });
  }
}

module.exports = { PdfDocUnicode, PAGE_W, PAGE_H };
