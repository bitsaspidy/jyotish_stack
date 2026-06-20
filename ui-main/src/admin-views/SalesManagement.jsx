'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const moneyK = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return money(v);
};

const STATUS_STYLE = {
  paid:      { bg: 'rgba(52,211,153,0.12)', color: '#34D399', border: 'rgba(52,211,153,0.25)' },
  refunded:  { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', border: 'rgba(239,68,68,0.25)' },
};

// ── Business / GST settings panel ─────────────────────────────────────────────
const CONFIG_FIELDS = [
  { key: 'business_legal_name', label: 'Legal Business Name', type: 'text', full: true },
  { key: 'business_gstin', label: 'GSTIN', type: 'text' },
  { key: 'business_pan', label: 'PAN', type: 'text' },
  { key: 'business_state', label: 'State', type: 'text' },
  { key: 'business_state_code', label: 'State Code', type: 'text' },
  { key: 'business_email', label: 'Billing Email', type: 'text' },
  { key: 'business_phone', label: 'Phone', type: 'text' },
  { key: 'business_address', label: 'Address', type: 'textarea', full: true },
  { key: 'gst_rate', label: 'GST Rate (%)', type: 'number' },
  { key: 'hsn_sac', label: 'HSN / SAC Code', type: 'text' },
  { key: 'invoice_prefix', label: 'Invoice Prefix', type: 'text' },
];

function Toggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative',
      background: on ? '#D4AF37' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: on ? 20 : 2 }} />
    </button>
  );
}

function BusinessSettings({ onClose }) {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    adminApi.get('/admin/sales/business-config')
      .then(({ data }) => setCfg(data.config))
      .catch(() => toast.error('Failed to load business settings'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...cfg, gst_enabled: String(!!cfg.gst_enabled), gst_inclusive: String(!!cfg.gst_inclusive) };
      await adminApi.put('/admin/sales/business-config', payload);
      toast.success('Business settings saved');
      onClose?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (!cfg) return <div style={{ padding: 20, color: 'rgba(245,240,232,0.4)', fontSize: 13 }}>Loading settings…</div>;

  const inputStyle = { width: '100%', boxSizing: 'border-box', background: '#0D0F1E', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 6, color: '#F5F0E8', padding: '8px 11px', fontSize: 13, outline: 'none' };
  const labelStyle = { display: 'block', color: 'rgba(245,240,232,0.45)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 };

  return (
    <div style={{ background: '#111428', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 10, padding: '22px 24px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ color: '#D4AF37', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700 }}>🏢 Business & GST Settings</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(245,240,232,0.4)', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: 12, marginBottom: 18 }}>These appear on every invoice. Fill in your real GSTIN and legal details for compliant tax invoices.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
        {CONFIG_FIELDS.map(({ key, label, type, full }) => (
          <div key={key} style={full ? { gridColumn: '1 / -1' } : undefined}>
            <label style={labelStyle}>{label}</label>
            {type === 'textarea'
              ? <textarea value={cfg[key] ?? ''} onChange={(e) => set(key, e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              : <input type={type} value={cfg[key] ?? ''} onChange={(e) => set(key, type === 'number' ? e.target.value : e.target.value)} style={inputStyle} />}
          </div>
        ))}
        <div>
          <label style={labelStyle}>Tax Split Mode</label>
          <select value={cfg.tax_split_mode || 'auto'} onChange={(e) => set('tax_split_mode', e.target.value)} style={inputStyle}>
            <option value="auto">Auto (by state)</option>
            <option value="cgst_sgst">Always CGST + SGST</option>
            <option value="igst">Always IGST</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle on={!!cfg.gst_enabled} onClick={() => set('gst_enabled', !cfg.gst_enabled)} />
          <span style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>GST Registered (Tax Invoice)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle on={!!cfg.gst_inclusive} onClick={() => set('gst_inclusive', !cfg.gst_inclusive)} />
          <span style={{ color: 'rgba(245,240,232,0.7)', fontSize: 13 }}>Prices are GST-inclusive</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(245,240,232,0.55)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color: '#0B0D1A', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Summary card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ flex: '1 1 170px', background: '#111428', border: '1px solid rgba(212,175,55,0.12)', borderTop: `3px solid ${accent}`, borderRadius: 8, padding: '16px 18px' }}>
      <p style={{ color: 'rgba(245,240,232,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
      <p style={{ color: accent, fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: 12, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Invoice Edit Modal ─────────────────────────────────────────────────────────
const INP = { width: '100%', boxSizing: 'border-box', background: '#0D0F1E', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 6, color: '#F5F0E8', padding: '8px 11px', fontSize: 13, outline: 'none' };
const LBL = { display: 'block', color: 'rgba(245,240,232,0.45)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 };

function InvoiceEditModal({ invoice, onClose, onSaved }) {
  const currentMode = () => {
    if (!invoice) return 'igst';
    if (Number(invoice.total_tax) === 0) return 'no_tax';
    return invoice.is_interstate ? 'igst' : 'cgst_sgst';
  };

  const [taxMode,  setTaxMode]  = useState(currentMode);
  const [state,    setState]    = useState(invoice?.customer_state  || '');
  const [gstin,    setGstin]    = useState(invoice?.customer_gstin  || '');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await adminApi.patch(`/admin/sales/${invoice.uuid}`, {
        tax_mode:       taxMode,
        customer_state: state  || undefined,
        customer_gstin: gstin  || undefined,
      });
      toast.success('Invoice updated');
      onSaved(data.invoice);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (!invoice) return null;

  const TAX_MODES = [
    { value: 'igst',     label: 'IGST (Inter-state / default)',       desc: 'Customer is in a different state or state unknown' },
    { value: 'cgst_sgst',label: 'CGST + SGST (Same state)',           desc: 'Customer is in the same state as your business' },
    { value: 'no_tax',   label: 'No Tax (International / Exempt)',    desc: 'Customer is outside India or transaction is exempt' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#111428', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: '28px 28px 24px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#D4AF37', fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Invoice</h2>
            <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: 12, margin: '4px 0 0' }}>{invoice.invoice_number} · {invoice.customer_name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,240,232,0.4)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Current values */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
          {[
            { l: 'Total Paid', v: money(invoice.total_amount) },
            { l: 'Taxable', v: money(invoice.taxable_value) },
            { l: 'Tax', v: money(invoice.total_tax) },
            { l: 'CGST', v: money(invoice.cgst) },
            { l: 'SGST', v: money(invoice.sgst) },
            { l: 'IGST', v: money(invoice.igst) },
          ].map(({ l, v }) => (
            <div key={l}>
              <p style={{ color: 'rgba(245,240,232,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>{l}</p>
              <p style={{ color: 'rgba(245,240,232,0.75)', fontSize: 12, fontWeight: 600, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Tax mode */}
        <div style={{ marginBottom: 18 }}>
          <label style={LBL}>Tax Type</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TAX_MODES.map(({ value, label, desc }) => (
              <label key={value} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', padding: '10px 12px', borderRadius: 7, border: `1px solid ${taxMode === value ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)'}`, background: taxMode === value ? 'rgba(212,175,55,0.07)' : 'transparent', transition: 'all 0.15s' }}>
                <input type="radio" name="tax_mode" value={value} checked={taxMode === value} onChange={() => setTaxMode(value)} style={{ marginTop: 2, accentColor: '#D4AF37' }} />
                <div>
                  <p style={{ color: taxMode === value ? '#D4AF37' : 'rgba(245,240,232,0.75)', fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
                  <p style={{ color: 'rgba(245,240,232,0.38)', fontSize: 11, margin: '2px 0 0' }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Customer state */}
        {taxMode !== 'no_tax' && (
          <div style={{ marginBottom: 14 }}>
            <label style={LBL}>Customer State <span style={{ color: 'rgba(245,240,232,0.3)', textTransform: 'none', fontWeight: 400 }}>(optional — for records)</span></label>
            <input style={INP} value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Maharashtra, Delhi, Karnataka" />
          </div>
        )}

        {/* Customer GSTIN */}
        {taxMode !== 'no_tax' && (
          <div style={{ marginBottom: 20 }}>
            <label style={LBL}>Customer GSTIN <span style={{ color: 'rgba(245,240,232,0.3)', textTransform: 'none', fontWeight: 400 }}>(optional — B2B only)</span></label>
            <input style={INP} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>
        )}

        {/* Preview of new tax split */}
        <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 7, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ color: 'rgba(212,175,55,0.7)', fontSize: 11, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>After save, invoice will show:</p>
          {taxMode === 'no_tax'    && <p style={{ color: '#34D399', fontSize: 13, margin: 0 }}>No GST — Bill of Supply  ·  ₹0 tax</p>}
          {taxMode === 'igst'      && <p style={{ color: '#D4AF37', fontSize: 13, margin: 0 }}>IGST @ 18%  ·  tax recomputed on ₹{Number(invoice.total_amount).toLocaleString('en-IN')}</p>}
          {taxMode === 'cgst_sgst' && <p style={{ color: '#60A5FA', fontSize: 13, margin: 0 }}>CGST 9% + SGST 9%  ·  tax recomputed on ₹{Number(invoice.total_amount).toLocaleString('en-IN')}</p>}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(245,240,232,0.5)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color: '#0B0D1A', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────────────────────
export default function SalesManagement() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [busy, setBusy] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminApi.get('/admin/sales', { params: { page, status: status || undefined, search: search || undefined } })
      .then(({ data }) => {
        setInvoices(data.invoices);
        setSummary(data.summary);
        setTotal(Number(data.pagination.total));
      })
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const downloadInvoice = async (inv) => {
    setBusy((b) => ({ ...b, [inv.uuid]: 'dl' }));
    try {
      const r = await adminApi.get(`/admin/sales/${inv.uuid}/invoice.pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${inv.invoice_number.replace(/[^\w.-]+/g, '-')}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error('Unable to download invoice'); }
    finally { setBusy((b) => ({ ...b, [inv.uuid]: null })); }
  };

  const handleInvoiceSaved = (updated) => {
    setInvoices((prev) => prev.map((inv) => inv.uuid === updated.uuid ? { ...inv, ...updated } : inv));
  };

  const resendInvoice = async (inv) => {
    setBusy((b) => ({ ...b, [inv.uuid]: 'send' }));
    try {
      await adminApi.post(`/admin/sales/${inv.uuid}/resend`);
      toast.success(`Invoice e-mailed to ${inv.customer_email}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Resend failed'); }
    finally { setBusy((b) => ({ ...b, [inv.uuid]: null })); }
  };

  const taxLabel = (inv) => {
    if (Number(inv.total_tax) <= 0) return '—';
    return inv.is_interstate ? `IGST ${money(inv.igst)}` : `${money(Number(inv.cgst) + Number(inv.sgst))}`;
  };

  return (
    <div>
      {editInvoice && (
        <InvoiceEditModal
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSaved={handleInvoiceSaved}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#D4AF37', fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, marginBottom: 3 }}>Sales Management</h1>
          <p style={{ color: 'rgba(245,240,232,0.38)', fontSize: 13 }}>{total} invoice{total !== 1 ? 's' : ''} · track payments, GST & download invoices</p>
        </div>
        <button onClick={() => setShowSettings((s) => !s)} style={{ padding: '9px 18px', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          🏢 Business & GST Settings
        </button>
      </div>

      {showSettings && <BusinessSettings onClose={() => setShowSettings(false)} />}

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="Total Revenue" value={moneyK(summary.revenue)} sub={`${summary.paid_count} paid invoice${summary.paid_count !== 1 ? 's' : ''}`} accent="#34D399" />
          <StatCard label="GST Collected" value={moneyK(summary.tax)} sub="output tax" accent="#D4AF37" />
          <StatCard label="Net (Taxable)" value={moneyK(summary.taxable)} sub="pre-tax value" accent="#60A5FA" />
          <StatCard label="This Month" value={moneyK(summary.month_revenue)} sub={`${summary.month_count} sale${summary.month_count !== 1 ? 's' : ''}`} accent="#A78BFA" />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search invoice #, customer, email, payment id…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: '1 1 280px', background: '#0D0F1E', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 6, color: '#F5F0E8', padding: '9px 13px', fontSize: 13, outline: 'none' }}
        />
        {[
          { key: '', label: 'All' },
          { key: 'paid', label: 'Paid' },
          { key: 'refunded', label: 'Refunded' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(({ key, label }) => {
          const active = status === key;
          const c = STATUS_STYLE[key]?.color || 'rgba(245,240,232,0.5)';
          return (
            <button key={key} onClick={() => { setStatus(key); setPage(1); }} style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? c + '44' : 'rgba(255,255,255,0.1)'}`,
              color: active ? c : 'rgba(245,240,232,0.45)', transition: 'all 0.15s',
            }}>{label}</button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#111428', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1020 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                {['Invoice #', 'Date', 'Customer', 'Plan', 'Taxable', 'GST', 'Total', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'rgba(212,175,55,0.6)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: 13 }}>Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: 13 }}>
                  No sales yet. Invoices appear here automatically after each successful payment.
                </td></tr>
              ) : invoices.map((inv) => {
                const ss = STATUS_STYLE[inv.status] || STATUS_STYLE.paid;
                return (
                  <tr key={inv.uuid} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.025)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: '#D4AF37', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {inv.invoice_number}
                      {inv.document_type === 'bill_of_supply' && <span style={{ marginLeft: 6, fontSize: 9, color: 'rgba(245,240,232,0.4)' }}>(BoS)</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'rgba(245,240,232,0.5)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(inv.issued_at || inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5 }}>
                      <div style={{ color: 'rgba(245,240,232,0.85)' }}>{inv.customer_name || '—'}</div>
                      <div style={{ color: 'rgba(245,240,232,0.4)', fontSize: 11 }}>{inv.customer_email}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'rgba(245,240,232,0.7)', fontSize: 12.5 }}>{inv.plan_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'rgba(245,240,232,0.6)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{money(inv.taxable_value)}</td>
                    <td style={{ padding: '10px 14px', color: 'rgba(245,240,232,0.6)', fontSize: 12, whiteSpace: 'nowrap' }}>{taxLabel(inv)}</td>
                    <td style={{ padding: '10px 14px', color: '#34D399', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{money(inv.total_amount)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, fontWeight: 600, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'capitalize' }}>{inv.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => downloadInvoice(inv)} disabled={busy[inv.uuid]} title="Download invoice PDF" style={{
                        padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                        fontSize: 11, fontWeight: 700, cursor: busy[inv.uuid] ? 'wait' : 'pointer', marginRight: 6,
                      }}>{busy[inv.uuid] === 'dl' ? '⏳' : '⬇ PDF'}</button>
                      <button onClick={() => resendInvoice(inv)} disabled={busy[inv.uuid]} title="Email invoice to customer" style={{
                        padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.1)', color: '#60A5FA',
                        fontSize: 11, fontWeight: 700, cursor: busy[inv.uuid] ? 'wait' : 'pointer', marginRight: 6,
                      }}>{busy[inv.uuid] === 'send' ? '⏳' : '✉️'}</button>
                      <button onClick={() => setEditInvoice(inv)} title="Edit invoice tax / GST" style={{
                        padding: '4px 10px', borderRadius: 5, border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}>✏️ Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'rgba(245,240,232,0.35)', fontSize: 12 }}>
            Showing {total ? Math.min((page - 1) * 20 + 1, total) : 0}–{Math.min(page * 20, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid rgba(212,175,55,0.2)', background: 'transparent', color: page === 1 ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>←</button>
            <span style={{ color: 'rgba(245,240,232,0.45)', fontSize: 12 }}>{page} / {Math.ceil(total / 20) || 1}</span>
            <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid rgba(212,175,55,0.2)', background: 'transparent', color: page * 20 >= total ? 'rgba(245,240,232,0.2)' : '#D4AF37', cursor: page * 20 >= total ? 'default' : 'pointer', fontSize: 12 }}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
