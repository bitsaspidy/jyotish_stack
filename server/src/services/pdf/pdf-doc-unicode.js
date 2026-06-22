'use strict';
// Unicode-capable PDF writer using pdfkit + Noto Sans Devanagari.
// Exposes the same API surface as pdf-doc.js so remedy-package-pdf.js
// can swap it in without touching any drawing logic.
const PDFDocument = require('pdfkit');
const path        = require('path');

const PAGE_W = 595;
const PAGE_H = 842;

const FONTS_DIR = path.join(__dirname, 'fonts');
const FONT_REG  = path.join(FONTS_DIR, 'NotoSansDevanagari-Regular.ttf');
const FONT_BOLD = path.join(FONTS_DIR, 'NotoSansDevanagari-Bold.ttf');

class PdfDocUnicode {
  constructor() {
    this._doc = new PDFDocument({
      size:          [PAGE_W, PAGE_H],
      margin:        0,
      autoFirstPage: false,
      info:          { Creator: 'Jyotish Stack AI' },
    });
    this._doc.registerFont('Reg',  FONT_REG);
    this._doc.registerFont('Bold', FONT_BOLD);
    this._chunks = [];
    this._doc.on('data', chunk => this._chunks.push(chunk));
  }

  addPage() {
    this._doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
    return this;
  }

  _f(bold) { return bold ? 'Bold' : 'Reg'; }

  // ── Graphics primitives ──────────────────────────────────────────────────────

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

  // ── Text ─────────────────────────────────────────────────────────────────────

  text(x, y, str, opts = {}) {
    if (!str) return this;
    const { size = 10, color = '#000000', bold = false, align = 'left', width = 0 } = opts;
    const d = this._doc;
    d.save().font(this._f(bold)).fontSize(size).fillColor(color);
    const tOpts = { lineBreak: false };
    if (width && align !== 'left') { tOpts.width = width; tOpts.align = align; }
    d.text(String(str), x, y, tOpts);
    d.restore();
    return this;
  }

  // Returns rendered string width using current font metrics (no side-effects on output).
  textWidth(str, size, bold = false) {
    this._doc.font(this._f(bold)).fontSize(size);
    return this._doc.widthOfString(String(str));
  }

  // Splits str into lines that fit within maxWidth at the given size.
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

  // Multi-line paragraph (matches pdf-doc.js para signature).
  para(x, y, str, maxWidth, opts = {}) {
    const { size = 9, lineGap = 3.5 } = opts;
    const lines = this.wrap(str, maxWidth, size, opts.bold);
    lines.forEach((ln, i) => this.text(x, y + i * (size + lineGap), ln, { size, ...opts }));
    return lines.length * (size + lineGap);
  }

  // Returns Promise<Buffer> — use with await in async callers.
  build() {
    return new Promise((resolve, reject) => {
      this._doc.on('end',   () => resolve(Buffer.concat(this._chunks)));
      this._doc.on('error', reject);
      this._doc.end();
    });
  }
}

module.exports = { PdfDocUnicode, PAGE_W, PAGE_H };
