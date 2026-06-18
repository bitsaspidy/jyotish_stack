'use strict';
// GST Tax Invoice / Bill of Supply — single A4 page, print-friendly (white bg
// with navy + gold brand accents). Built on the zero-dependency PdfDoc writer.
const { PdfDoc } = require('./pdf-doc');

const NAVY = '#0B0D1A';
const GOLD = '#B8860B';   // slightly deeper gold so it reads on white paper
const GOLDL = '#D4AF37';
const INK = '#1F2433';
const MUTE = '#6B7280';
const LINE = '#E3E6EC';
const HEADTX = '#F5EFD8';

// ─── Money + words helpers ─────────────────────────────────────────────────────
function groupIndian(intStr) {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  let rest = intStr.slice(0, -3);
  const parts = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}
function money(n) {
  const v = Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  const abs = Math.abs(v);
  const int = Math.floor(abs).toString();
  const dec = Math.round((abs - Math.floor(abs)) * 100).toString().padStart(2, '0');
  return `${v < 0 ? '-' : ''}Rs. ${groupIndian(int)}.${dec}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function below1000(n) {
  let s = '';
  if (n >= 100) { s += `${ONES[Math.floor(n / 100)]} Hundred`; n %= 100; if (n) s += ' '; }
  if (n >= 20) { s += TENS[Math.floor(n / 10)]; if (n % 10) s += ` ${ONES[n % 10]}`; }
  else if (n > 0) s += ONES[n];
  return s;
}
function intToWords(n) {
  if (n === 0) return 'Zero';
  let s = '';
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) s += `${intToWords(crore)} Crore `;
  if (lakh) s += `${below1000(lakh)} Lakh `;
  if (thousand) s += `${below1000(thousand)} Thousand `;
  if (n) s += below1000(n);
  return s.trim();
}
function amountInWords(amount) {
  const v = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  const rupees = Math.floor(v);
  const paise = Math.round((v - rupees) * 100);
  let out = `Indian Rupees ${intToWords(rupees)}`;
  if (paise > 0) out += ` and ${below1000(paise)} Paise`;
  return `${out} Only`;
}

function fmtDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Builder ───────────────────────────────────────────────────────────────────
function buildInvoicePdf(invoice, business = {}) {
  const isTax = invoice.document_type !== 'bill_of_supply' && Number(invoice.total_tax) > 0;
  const interstate = !!invoice.is_interstate;
  const rate = Number(invoice.gst_rate) || 0;

  const sellerName = invoice.seller_name || business.business_legal_name || 'Jyotish Stack AI';
  const sellerGstin = invoice.seller_gstin || business.business_gstin || '';
  const sellerState = invoice.seller_state || business.business_state || '';
  const sellerAddr = invoice.seller_address || business.business_address || '';
  const sellerEmail = business.business_email || 'account@jyotishstack.com';
  const sellerPhone = business.business_phone || '';
  const sellerPan = business.business_pan || '';

  const d = new PdfDoc();
  d.addPage();
  const L = 40, R = 555, W = R - L; // content band

  // ── Header band ──────────────────────────────────────────────────────────────
  d.rect(0, 0, 595, 92, NAVY);
  d.rect(0, 92, 595, 3, GOLDL);
  d.text(L, 26, 'JYOTISH STACK AI', { size: 21, bold: true, color: GOLDL });
  d.text(L, 54, 'Ancient Wisdom  -  Modern Intelligence', { size: 9, color: HEADTX });
  d.text(L, 70, 'jyotishstack.com', { size: 9, color: HEADTX });
  d.text(335, 28, isTax ? 'TAX INVOICE' : 'BILL OF SUPPLY', { size: 19, bold: true, color: GOLDL, align: 'right', width: 220 });
  d.text(335, 56, `Invoice No: ${invoice.invoice_number || '-'}`, { size: 9.5, color: HEADTX, align: 'right', width: 220 });
  d.text(335, 72, `Date: ${fmtDate(invoice.issued_at || invoice.created_at)}`, { size: 9.5, color: HEADTX, align: 'right', width: 220 });

  let y = 118;

  // ── Billed By / Invoice meta ───────────────────────────────────────────────────
  const colR = 330; // right column x
  d.text(L, y, 'BILLED BY', { size: 9, bold: true, color: GOLD });
  d.text(colR, y, 'PAYMENT DETAILS', { size: 9, bold: true, color: GOLD });
  y += 16;

  let ly = y;
  d.text(L, ly, sellerName, { size: 11.5, bold: true, color: INK }); ly += 15;
  if (sellerAddr) ly += d.para(L, ly, sellerAddr, 250, { size: 8.8, color: MUTE, lineGap: 2.5 }) + 2;
  if (sellerState) { d.text(L, ly, `State: ${sellerState}`, { size: 8.8, color: MUTE }); ly += 12; }
  if (isTax && sellerGstin) { d.text(L, ly, `GSTIN: ${sellerGstin}`, { size: 9, bold: true, color: INK }); ly += 13; }
  if (sellerPan) { d.text(L, ly, `PAN: ${sellerPan}`, { size: 8.8, color: MUTE }); ly += 12; }
  if (sellerEmail) { d.text(L, ly, `Email: ${sellerEmail}`, { size: 8.8, color: MUTE }); ly += 12; }
  if (sellerPhone) { d.text(L, ly, `Phone: ${sellerPhone}`, { size: 8.8, color: MUTE }); ly += 12; }

  // Right meta key/value rows
  let ry = y;
  const meta = [
    ['Order ID', invoice.razorpay_order_id || '-'],
    ['Payment ID', invoice.razorpay_payment_id || '-'],
    ['Plan', invoice.plan_name || '-'],
    ['Place of Supply', invoice.place_of_supply || '-'],
    ['Status', String(invoice.status || 'paid').toUpperCase()],
  ];
  meta.forEach(([k, v]) => {
    d.text(colR, ry, k, { size: 8.8, color: MUTE });
    d.text(colR + 95, ry, String(v), { size: 8.8, color: INK, bold: false });
    ry += 13.5;
  });

  y = Math.max(ly, ry) + 8;

  // ── Billed To ──────────────────────────────────────────────────────────────────
  d.line(L, y, R, y, LINE, 1); y += 12;
  d.text(L, y, 'BILLED TO', { size: 9, bold: true, color: GOLD }); y += 16;
  d.text(L, y, invoice.customer_name || '-', { size: 11, bold: true, color: INK }); y += 14;
  if (invoice.customer_email) { d.text(L, y, invoice.customer_email, { size: 9, color: MUTE }); y += 12; }
  const cust3 = [];
  if (invoice.customer_state) cust3.push(`State: ${invoice.customer_state}`);
  if (invoice.customer_gstin) cust3.push(`GSTIN: ${invoice.customer_gstin}`);
  if (cust3.length) { d.text(L, y, cust3.join('    '), { size: 9, color: MUTE }); y += 12; }
  y += 8;

  // ── Items table ─────────────────────────────────────────────────────────────────
  // Columns: # | Description | HSN/SAC | Qty | Rate | Amount
  const cx = { num: L, desc: L + 26, hsn: 300, qty: 360, rate: 392, amt: 470 };
  const cw = { rate: 75, amt: 85 };
  const rowH = 26;
  d.rect(L, y, W, 22, NAVY);
  const hy = y + 7;
  d.text(cx.num + 2, hy, '#', { size: 8.5, bold: true, color: HEADTX });
  d.text(cx.desc, hy, 'DESCRIPTION', { size: 8.5, bold: true, color: HEADTX });
  d.text(cx.hsn, hy, isTax ? 'SAC' : '', { size: 8.5, bold: true, color: HEADTX });
  d.text(cx.qty, hy, 'QTY', { size: 8.5, bold: true, color: HEADTX });
  d.text(cx.rate, hy, 'RATE', { size: 8.5, bold: true, color: HEADTX, align: 'right', width: cw.rate });
  d.text(cx.amt, hy, 'AMOUNT', { size: 8.5, bold: true, color: HEADTX, align: 'right', width: cw.amt });
  y += 22;

  // single line item
  const desc = `${invoice.plan_name || 'Subscription'} Plan - Jyotish Stack AI`;
  const iy = y + 8;
  d.text(cx.num + 2, iy, '1', { size: 9, color: INK });
  const descH = d.para(cx.desc, iy, desc, 250, { size: 9, color: INK, lineGap: 2.5 });
  if (isTax) d.text(cx.hsn, iy, invoice.hsn_sac || '999799', { size: 8.5, color: MUTE });
  d.text(cx.qty, iy, '1', { size: 9, color: INK });
  d.text(cx.rate, iy, money(invoice.taxable_value).replace('Rs. ', ''), { size: 9, color: INK, align: 'right', width: cw.rate });
  d.text(cx.amt, iy, money(invoice.taxable_value).replace('Rs. ', ''), { size: 9, color: INK, align: 'right', width: cw.amt });
  y += Math.max(rowH, descH + 14);
  d.line(L, y, R, y, LINE, 1);
  y += 12;

  // ── Tax summary (right aligned) ─────────────────────────────────────────────────
  const sumX = 330, sumLW = 150, sumVW = 75, sumVX = sumX + sumLW;
  const sumRow = (label, val, opts = {}) => {
    d.text(sumX, y, label, { size: opts.bold ? 10 : 9, bold: opts.bold, color: opts.color || (opts.bold ? INK : MUTE), align: 'right', width: sumLW });
    d.text(sumVX, y, val, { size: opts.bold ? 10 : 9, bold: opts.bold, color: opts.color || INK, align: 'right', width: sumVW });
    y += opts.bold ? 18 : 15;
  };
  sumRow('Taxable Value', money(invoice.taxable_value));
  if (isTax) {
    if (interstate) {
      sumRow(`IGST @ ${rate}%`, money(invoice.igst));
    } else {
      sumRow(`CGST @ ${(rate / 2)}%`, money(invoice.cgst));
      sumRow(`SGST @ ${(rate / 2)}%`, money(invoice.sgst));
    }
  } else {
    sumRow('GST', 'Not Applicable');
  }
  d.line(sumX, y, R, y, GOLD, 1); y += 8;
  sumRow('TOTAL', money(invoice.total_amount), { bold: true, color: NAVY });

  // ── Amount in words ──────────────────────────────────────────────────────────────
  y += 6;
  d.rect(L, y, W, 0.8, LINE);
  y += 10;
  d.text(L, y, 'Amount in words', { size: 8, bold: true, color: GOLD }); y += 13;
  y += d.para(L, y, amountInWords(invoice.total_amount), W, { size: 9.5, color: INK, lineGap: 3 });
  y += 10;

  // ── Notes / declaration ──────────────────────────────────────────────────────────
  const notes = [];
  if (invoice.gst_inclusive && isTax) notes.push('All amounts are inclusive of GST at the applicable rate.');
  if (isTax && !sellerGstin) notes.push('Note: Seller GSTIN not yet configured - update it in Admin > Sales > Business Settings.');
  if (!isTax) notes.push('GST is not applicable on this supply (supplier not registered under GST).');
  notes.push('This is a computer-generated invoice and does not require a physical signature.');
  d.rect(L, y, W, 0.8, LINE); y += 10;
  notes.forEach((n) => { y += d.para(L, y, `- ${n}`, W, { size: 8.2, color: MUTE, lineGap: 2.5 }) + 2; });

  // ── Footer band ──────────────────────────────────────────────────────────────────
  d.rect(0, 812, 595, 30, NAVY);
  d.text(0, 823, 'Thank you for choosing Jyotish Stack AI  -  For billing queries: account@jyotishstack.com', { size: 8.5, color: HEADTX, align: 'center', width: 595 });

  return d.build();
}

module.exports = { buildInvoicePdf, amountInWords, money };
