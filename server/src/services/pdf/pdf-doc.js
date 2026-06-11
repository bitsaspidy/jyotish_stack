'use strict';
// Minimal zero-dependency PDF writer with graphics support.
// Coordinate system used by callers: x from left, y from TOP of page
// (converted to PDF bottom-left internally). A4 portrait only.

const PAGE_W = 595;
const PAGE_H = 842;

// Standard Helvetica / Helvetica-Bold AFM widths (chars 32..126, 1/1000 em)
const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];

function ascii(value) {
  return String(value ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/°/g, ' deg').replace(/[^\x20-\x7E]/g, '')
    .replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
}
function esc(value) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function hexRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${((n >> 16 & 255) / 255).toFixed(3)} ${((n >> 8 & 255) / 255).toFixed(3)} ${((n & 255) / 255).toFixed(3)}`;
}

class PdfDoc {
  constructor() {
    this.pages = [];   // each: array of content-stream op strings
    this.cur = null;
  }

  addPage() {
    this.cur = [];
    this.pages.push(this.cur);
    return this;
  }

  // y given from top
  _y(y) { return PAGE_H - y; }

  textWidth(str, size, bold = false) {
    const tbl = bold ? W_BOLD : W_REG;
    let w = 0;
    for (const ch of ascii(str)) {
      const c = ch.charCodeAt(0);
      w += (c >= 32 && c <= 126) ? tbl[c - 32] : 556;
    }
    return (w / 1000) * size;
  }

  // Filled rectangle. x,y = top-left corner.
  rect(x, y, w, h, color) {
    this.cur.push(`${hexRgb(color)} rg`, `${x} ${this._y(y) - h} ${w} ${h} re f`);
    return this;
  }

  // Stroked rectangle outline
  rectStroke(x, y, w, h, color, width = 1) {
    this.cur.push(`${hexRgb(color)} RG`, `${width} w`, `${x} ${this._y(y) - h} ${w} ${h} re S`);
    return this;
  }

  line(x1, y1, x2, y2, color, width = 1) {
    this.cur.push(`${hexRgb(color)} RG`, `${width} w`, `${x1} ${this._y(y1)} m ${x2} ${this._y(y2)} l S`);
    return this;
  }

  // Closed stroked polygon from [[x,y],...] points (y from top)
  poly(points, color, width = 1) {
    const ops = points.map(([px, py], i) => `${px} ${this._y(py)} ${i === 0 ? 'm' : 'l'}`);
    this.cur.push(`${hexRgb(color)} RG`, `${width} w`, ...ops, 'h S');
    return this;
  }

  polyFill(points, color) {
    const ops = points.map(([px, py], i) => `${px} ${this._y(py)} ${i === 0 ? 'm' : 'l'}`);
    this.cur.push(`${hexRgb(color)} rg`, ...ops, 'h f');
    return this;
  }

  circle(cx, cy, r, color, width = 1, fill = false) {
    // Bezier circle approximation
    const k = 0.5523 * r;
    const y = this._y(cy);
    this.cur.push(
      fill ? `${hexRgb(color)} rg` : `${hexRgb(color)} RG`,
      `${width} w`,
      `${cx + r} ${y} m`,
      `${cx + r} ${y + k} ${cx + k} ${y + r} ${cx} ${y + r} c`,
      `${cx - k} ${y + r} ${cx - r} ${y + k} ${cx - r} ${y} c`,
      `${cx - r} ${y - k} ${cx - k} ${y - r} ${cx} ${y - r} c`,
      `${cx + k} ${y - r} ${cx + r} ${y - k} ${cx + r} ${y} c`,
      fill ? 'f' : 'S'
    );
    return this;
  }

  // Single line of text. opts: size, color, bold, oblique, align ('left'|'center'|'right'), width (for align box)
  text(x, y, str, opts = {}) {
    const { size = 10, color = '#000000', bold = false, oblique = false, align = 'left', width = 0 } = opts;
    const s = ascii(str);
    if (!s) return this;
    let tx = x;
    if (align !== 'left') {
      const tw = this.textWidth(s, size, bold);
      if (align === 'center') tx = x + (width - tw) / 2;
      if (align === 'right')  tx = x + width - tw;
    }
    const font = bold ? '/F2' : oblique ? '/F3' : '/F1';
    this.cur.push('BT', `${hexRgb(color)} rg`, `${font} ${size} Tf`, `${tx.toFixed(1)} ${(this._y(y) - size).toFixed(1)} Td`, `(${esc(s)}) Tj`, 'ET');
    return this;
  }

  // Wrap text into lines that fit maxWidth; returns the lines (does not draw)
  wrap(str, maxWidth, size, bold = false) {
    const words = ascii(str).split(' ');
    const lines = [];
    let line = '';
    for (const wd of words) {
      const next = line ? `${line} ${wd}` : wd;
      if (this.textWidth(next, size, bold) > maxWidth && line) { lines.push(line); line = wd; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  // Draw wrapped paragraph; returns height consumed
  para(x, y, str, maxWidth, opts = {}) {
    const { size = 9, lineGap = 3.5 } = opts;
    const lines = this.wrap(str, maxWidth, size, opts.bold);
    lines.forEach((ln, i) => this.text(x, y + i * (size + lineGap), ln, opts));
    return lines.length * (size + lineGap);
  }

  build() {
    const objects = [];
    const add = (body) => { objects.push(body); return objects.length; };
    const catalogId = add('');
    const pagesId = add('');
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const f3 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');
    const pageIds = [];

    for (const ops of this.pages) {
      const content = ['q', ...ops, 'Q'].join('\n');
      const cId = add(`<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream`);
      const pId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> /Contents ${cId} 0 R >>`);
      pageIds.push(pId);
    }

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let body = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(body, 'binary'));
      body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(body, 'binary');
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(body, 'binary');
  }
}

module.exports = { PdfDoc, PAGE_W, PAGE_H, ascii };
