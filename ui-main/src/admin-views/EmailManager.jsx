'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';
import RichTextEditor from '../admin-components/RichTextEditor';

// ─── Colour palette ───────────────────────────────────────────────────────────
const DEPT_COLOR = { sales:'#F59E0B', team:'#10B981', account:'#818CF8', legal:'#F472B6', all:'#D4AF37' };
const DEPT_LABEL = { sales:'Sales', team:'Support', account:'Accounts', legal:'Legal', all:'All Inboxes' };
const DEPT_EMAIL = { sales:'sales@jyotishstack.com', team:'team@jyotishstack.com', account:'account@jyotishstack.com', legal:'legal@jyotishstack.com' };

const gold   = '#D4AF37';
const navy   = '#0B0D1A';
const ivory  = '#F5F0E8';
const red    = '#F87171';
const green  = '#34D399';

const STATUS_COLOR = { sent: green, failed: red, queued:'#FBBF24', retried:'#94A3B8', retrying:'#60A5FA' };
const STATUS_LABEL = { retried:'resent' }; // DB value 'retried' shows as "resent"

// ─── Small helpers ────────────────────────────────────────────────────────────
function Badge({ dept }) {
  const c = DEPT_COLOR[dept] || gold;
  return (
    <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:`${c}18`, color:c, border:`1px solid ${c}33`, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
      {DEPT_LABEL[dept] || dept}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || '#94A3B8';
  return (
    <span style={{ fontSize:9, padding:'1px 7px', borderRadius:8, background:`${c}18`, color:c, border:`1px solid ${c}33`, fontWeight:700, textTransform:'uppercase' }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return 'just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs/60000)}m ago`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}

// ─── SMTP Test Panel ──────────────────────────────────────────────────────────
function SmtpTestPanel() {
  const [testing, setTesting] = useState(null); // dept key while testing
  const [results, setResults] = useState({});   // dept → { ok, msg }

  const test = async (dept) => {
    setTesting(dept);
    try {
      const { data } = await adminApi.post('/admin/email-manager/test-smtp', { dept });
      setResults(r => ({ ...r, [dept]: { ok: true, msg: `Connected · ${data.from}` } }));
    } catch (e) {
      const msg = e.response?.data?.message || e.message || 'Connection failed';
      setResults(r => ({ ...r, [dept]: { ok: false, msg } }));
    } finally { setTesting(null); }
  };

  return (
    <div style={{ padding:'10px 8px 8px', borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto' }}>
      <p style={{ color:'rgba(245,240,232,0.22)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8, paddingLeft:6 }}>
        Test SMTP
      </p>
      {['account','sales','team'].map(dept => {
        const res = results[dept];
        return (
          <div key={dept} style={{ marginBottom:6 }}>
            <button
              onClick={() => test(dept)}
              disabled={!!testing}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'5px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.07)',
                background:'rgba(255,255,255,0.03)', cursor: testing ? 'wait' : 'pointer',
                color:'rgba(245,240,232,0.5)', fontSize:11, opacity: testing && testing !== dept ? 0.5 : 1,
              }}
            >
              <span>{dept}</span>
              <span style={{ fontSize:10, color: testing === dept ? '#FBBF24' : (res ? (res.ok ? '#34D399' : '#F87171') : 'rgba(245,240,232,0.25)') }}>
                {testing === dept ? '…' : (res ? (res.ok ? '✓ OK' : '✗ Fail') : 'Test →')}
              </span>
            </button>
            {res && (
              <p style={{ fontSize:9.5, padding:'2px 8px 0', color: res.ok ? '#34D399' : '#F87171', lineHeight:1.4, wordBreak:'break-all' }}>
                {res.msg}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onSent, signatures, defaultDept }) {
  const [form, setForm]     = useState({ from_dept: defaultDept || 'team', to:'', cc:'', subject:'', body:'' });
  const [sending, setSend]  = useState(false);
  const sig = signatures?.[form.from_dept];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const send = async () => {
    if (!form.to || !form.subject || !form.body) return toast.error('To, Subject and Body are required');
    setSend(true);
    try {
      await adminApi.post('/admin/email-manager/compose', {
        from_dept: form.from_dept,
        to:        form.to,
        subject:   form.subject,
        body:      form.body, // already HTML from the rich editor
        reply_to:  form.cc || undefined,
      });
      toast.success('Email sent!');
      onSent();
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || 'Send failed — check SMTP settings'); }
    finally { setSend(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'flex-end', pointerEvents:'none' }}>
      <div className="email-compose-modal" style={{ pointerEvents:'all', width:540, height:'80vh', margin:'0 28px 28px 0', background:'#0F1120', border:`1px solid rgba(212,175,55,0.3)`, borderRadius:12, display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ padding:'14px 18px', borderBottom:`1px solid rgba(212,175,55,0.12)`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(212,175,55,0.06)', borderRadius:'12px 12px 0 0' }}>
          <span style={{ color:gold, fontWeight:700, fontSize:14 }}>✏️ New Message</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(245,240,232,0.4)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* From */}
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color:'rgba(245,240,232,0.4)', fontSize:12, width:54, flexShrink:0 }}>From</span>
            <select value={form.from_dept} onChange={e => set('from_dept', e.target.value)} style={{ flex:1, background:'transparent', border:'none', color:ivory, fontSize:13, outline:'none', cursor:'pointer' }}>
              <option value="sales">Sales — {DEPT_EMAIL.sales}</option>
              <option value="team">Support — {DEPT_EMAIL.team}</option>
              <option value="account">Accounts — {DEPT_EMAIL.account}</option>
            </select>
          </div>

          {/* To */}
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color:'rgba(245,240,232,0.4)', fontSize:12, width:54, flexShrink:0 }}>To</span>
            <input value={form.to} onChange={e => set('to', e.target.value)} placeholder="recipient@example.com" style={{ flex:1, background:'transparent', border:'none', color:ivory, fontSize:13, outline:'none' }} />
          </div>

          {/* CC */}
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color:'rgba(245,240,232,0.4)', fontSize:12, width:54, flexShrink:0 }}>CC</span>
            <input value={form.cc} onChange={e => set('cc', e.target.value)} placeholder="optional" style={{ flex:1, background:'transparent', border:'none', color:ivory, fontSize:13, outline:'none' }} />
          </div>

          {/* Subject */}
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color:'rgba(245,240,232,0.4)', fontSize:12, width:54, flexShrink:0 }}>Subject</span>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Email subject" style={{ flex:1, background:'transparent', border:'none', color:ivory, fontSize:13, outline:'none' }} />
          </div>

          {/* Body */}
          <RichTextEditor value={form.body} onChange={(html) => set('body', html)} minHeight={170} placeholder="Write your message…" />

          {/* Signature preview */}
          {sig?.is_active && sig?.signature_html && (
            <div style={{ padding:'10px 12px', background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:6, borderTop:'2px dashed rgba(212,175,55,0.2)' }}>
              <p style={{ color:'rgba(245,240,232,0.28)', fontSize:10, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Signature Preview</p>
              {sig.include_logo && (
                <div style={{ fontSize:11, color:'rgba(212,175,55,0.6)', marginBottom:4 }}>🪐 Jyotish Stack AI [logo]</div>
              )}
              <div style={{ color:'rgba(245,240,232,0.55)', fontSize:12, lineHeight:1.6 }} dangerouslySetInnerHTML={{ __html: sig.signature_html }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={send} disabled={sending} style={{
            padding:'9px 24px', borderRadius:6, border:'none', fontWeight:700, fontSize:13, cursor: sending ? 'not-allowed' : 'pointer',
            background: sending ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${gold},#F0D060,#A88B20)`,
            color: navy,
          }}>
            {sending ? '⏳ Sending…' : '📤 Send'}
          </button>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(245,240,232,0.5)', fontSize:13, cursor:'pointer' }}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ src, name, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.92)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
      <div style={{ position:'absolute', top:18, right:22, display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{name}</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.6)', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
      </div>
      <img src={src} alt={name} onClick={e => e.stopPropagation()} style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:6, boxShadow:'0 8px 40px rgba(0,0,0,0.7)' }} />
    </div>
  );
}

// ─── Attachments panel ────────────────────────────────────────────────────────
/**
 * DMARC aggregate report.
 *
 * These arrive daily with an empty body and the whole report zipped inside an
 * attachment, so the inbox shows what looks like a broken message. The server
 * decodes it; this states what it means. The question a reader has is only ever
 * "is someone forging my domain, and is my own mail authenticating?" — so that is
 * the answer, first, in a sentence.
 */
function DmarcPanel({ dmarc }) {
  if (!dmarc) return null;

  const clean = dmarc.all_passed;
  const tone = dmarc.empty ? { c:'rgba(245,240,232,0.5)', b:'rgba(255,255,255,0.1)', bg:'rgba(255,255,255,0.02)' }
    : clean ? { c:'#34D399', b:'rgba(52,211,153,0.3)', bg:'rgba(52,211,153,0.06)' }
    : { c:'#FBBF24', b:'rgba(251,191,36,0.35)', bg:'rgba(251,191,36,0.06)' };

  const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '');

  return (
    <div style={{ padding:'18px 22px' }}>
      <div style={{ border:`1px solid ${tone.b}`, background:tone.bg, borderRadius:10, padding:'16px 18px' }}>
        <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          DMARC report · {dmarc.org} · {day(dmarc.begin)}
        </p>

        <p style={{ color:tone.c, fontSize:15, fontWeight:700, marginTop:8, lineHeight:1.5 }}>
          {dmarc.empty
            ? 'No mail was reported for your domain in this period.'
            : clean
              ? `All ${dmarc.total} messages from ${dmarc.domain} passed authentication.`
              : `${dmarc.failed} of ${dmarc.total} messages failed authentication.`}
        </p>

        <p style={{ color:'rgba(245,240,232,0.6)', fontSize:12, lineHeight:1.7, marginTop:7 }}>
          {dmarc.empty
            ? 'Nothing claimed to be from your domain, so there is nothing to check.'
            : clean
              ? 'No one is successfully forging mail as your domain, and your own mail is signing correctly. Nothing to do.'
              : 'A failure is either your own mail not signing correctly, or someone sending as your domain. Check the senders below — if you do not recognise an address, it is a forgery attempt, and your DMARC policy decides what receivers do about it.'}
        </p>

        {/* Failing senders — the only part that ever needs action */}
        {!clean && !dmarc.empty && dmarc.failing_sources?.length > 0 && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:7 }}>
              Failing senders
            </p>
            {dmarc.failing_sources.map((s) => (
              <div key={s.ip} style={{ display:'flex', gap:10, alignItems:'center', padding:'4px 0', fontSize:11.5 }}>
                <span style={{ fontFamily:'ui-monospace, monospace', color:'rgba(245,240,232,0.8)', minWidth:120 }}>{s.ip}</span>
                <span style={{ color:'rgba(245,240,232,0.45)' }}>{s.count} message{s.count > 1 ? 's' : ''}</span>
                <span style={{ color:'#FB7185', fontSize:10 }}>
                  DKIM {s.dkim} · SPF {s.spf}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ color:'rgba(245,240,232,0.28)', fontSize:9.5, lineHeight:1.6, marginTop:12 }}>
          Policy <strong>p={dmarc.policy?.p}</strong> on {dmarc.policy?.pct}% of mail
          {dmarc.policy?.p === 'none' && ' — receivers are only reporting, not rejecting'}
          . {dmarc.source_count} sending source{dmarc.source_count === 1 ? '' : 's'} seen.
          Report {dmarc.report_id}.
        </p>
      </div>
    </div>
  );
}

function AttachmentsPanel({ attachments, email, adminApi: api, toast: t }) {
  const [lightbox, setLightbox] = useState(null); // { src, name }
  const [downloading, setDl]    = useState({});

  const download = async (att) => {
    setDl(d => ({ ...d, [att.index]: true }));
    try {
      const { data } = await api.get(
        `/admin/email-manager/attachment/${email.dept}/${email.uid}/${att.index}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([data], { type: att.contentType }));
      const a = document.createElement('a'); a.href = url; a.download = att.filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { t.error('Download failed'); }
    finally { setDl(d => ({ ...d, [att.index]: false })); }
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.015)', flexShrink:0 }}>
      <p style={{ color:'rgba(245,240,232,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
        📎 {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {attachments.map(att => (
          <div key={att.index} style={{
            display:'flex', flexDirection:'column', width: att.isImage && att.preview ? 120 : 'auto',
            border: att.suspicious ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius:8, overflow:'hidden', background:'rgba(255,255,255,0.03)',
            minWidth: att.isImage && att.preview ? 120 : 200,
          }}>
            {/* Image thumbnail */}
            {att.isImage && att.preview && (
              <div onClick={() => setLightbox({ src: att.preview, name: att.filename })} style={{ cursor:'zoom-in', height:80, overflow:'hidden', background:'rgba(0,0,0,0.3)' }}>
                <img src={att.preview} alt={att.filename} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
            )}
            {/* File info row */}
            <div style={{ padding:'7px 10px', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{fileIcon(att.contentType, att.filename)}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color: att.suspicious ? '#F87171' : 'rgba(245,240,232,0.75)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>
                  {att.filename}
                </p>
                <p style={{ color:'rgba(245,240,232,0.3)', fontSize:10 }}>
                  {fmtSize(att.size)}{att.suspicious ? ' · ⚠️ suspicious' : ''}
                </p>
              </div>
              <button onClick={() => download(att)} disabled={downloading[att.index]} title="Download" style={{
                background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5,
                color:'rgba(245,240,232,0.5)', fontSize:11, padding:'3px 7px', cursor:'pointer', flexShrink:0,
              }}>
                {downloading[att.index] ? '…' : '⬇'}
              </button>
            </div>
            {att.suspicious && (
              <div style={{ padding:'4px 10px', background:'rgba(239,68,68,0.08)', borderTop:'1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ color:'#F87171', fontSize:9, fontWeight:700 }}>POTENTIALLY UNSAFE FILE — download with caution</p>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightbox && <ImageLightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ─── Email detail panel ───────────────────────────────────────────────────────
function EmailDetail({ email, folder, onReply, onClose, onStar, onMarkUnread, onDelete }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!email?.html && iframeRef.current) return;
  }, [email]);

  if (!email) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'rgba(245,240,232,0.25)' }}>
      <span style={{ fontSize:40 }}>📧</span>
      <p style={{ fontSize:13 }}>Select an email to read</p>
    </div>
  );

  const isLogEmail = !!email._isLog;
  const bodyHtml   = email.html || email.html_body || '';
  const starred    = email.starred === true;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${email.subject}</title><style>body{font-family:sans-serif;font-size:14px;color:#000;padding:24px;} h1{font-size:18px;margin-bottom:8px;} .meta{color:#555;font-size:12px;margin-bottom:16px;line-height:1.8;} hr{border:none;border-top:1px solid #ddd;margin:16px 0;}</style></head><body>
      <h1>${email.subject || '(no subject)'}</h1>
      <div class="meta">
        <div><b>From:</b> ${typeof email.from === 'object' ? `${email.from.name || ''} &lt;${email.from.address}&gt;` : (email.from || '')}</div>
        <div><b>To:</b> ${email.to || ''}</div>
        ${email.cc ? `<div><b>CC:</b> ${email.cc}</div>` : ''}
        <div><b>Date:</b> ${email.date ? new Date(email.date).toLocaleString() : ''}</div>
      </div><hr>${bodyHtml || `<pre>${email.text || ''}</pre>`}</body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:6, flexShrink:0, background:'rgba(255,255,255,0.015)' }}>
        <button onClick={onClose} title="Back" style={{ background:'none', border:'none', color:'rgba(245,240,232,0.45)', cursor:'pointer', fontSize:15, padding:'3px 6px' }}>←</button>
        <div style={{ width:1, height:16, background:'rgba(255,255,255,0.08)', margin:'0 2px' }} />
        {!isLogEmail && (<>
          <ToolBtn icon={starred ? '★' : '☆'} label={starred ? 'Unstar' : 'Star'} active={starred} color="#FBBF24" onClick={() => onStar && onStar(email, !starred)} />
          <ToolBtn icon="✉" label="Mark as unread" onClick={() => onMarkUnread && onMarkUnread(email)} />
          <ToolBtn icon="↩" label="Reply" onClick={() => onReply(email)} />
          <ToolBtn icon="↗" label="Forward" onClick={() => onReply({ ...email, subject: `Fwd: ${email.subject}`, to: '' })} />
          <ToolBtn icon="🖨" label="Print" onClick={handlePrint} />
          <div style={{ flex:1 }} />
          <ToolBtn icon="🗑" label="Delete" color="#F87171" onClick={() => onDelete && onDelete(email)} />
        </>)}
        {isLogEmail && <div style={{ flex:1 }} />}
        {email.dept && <Badge dept={email.dept} />}
        {email.status && <StatusBadge status={email.status} />}
      </div>

      {/* Subject + meta */}
      <div style={{ padding:'14px 20px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
        <h2 style={{ color:ivory, fontSize:15, fontWeight:700, margin:'0 0 10px', lineHeight:1.4 }}>{email.subject || '(no subject)'}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', rowGap:3, columnGap:12, fontSize:12 }}>
          {email.from && <><span style={{ color:'rgba(245,240,232,0.38)' }}>From</span><span style={{ color:'rgba(245,240,232,0.75)' }}>{typeof email.from === 'object' ? `${email.from.name || ''} <${email.from.address}>` : email.from}</span></>}
          {email.to   && <><span style={{ color:'rgba(245,240,232,0.38)' }}>To</span><span style={{ color:'rgba(245,240,232,0.75)' }}>{email.to}</span></>}
          {email.cc && email.cc !== '' && <><span style={{ color:'rgba(245,240,232,0.38)' }}>CC</span><span style={{ color:'rgba(245,240,232,0.75)' }}>{email.cc}</span></>}
          <span style={{ color:'rgba(245,240,232,0.38)' }}>Date</span>
          <span style={{ color:'rgba(245,240,232,0.5)' }}>{email.date ? new Date(email.date).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'}</span>
        </div>
        {email.error_message && (
          <div style={{ marginTop:8, padding:'7px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6 }}>
            <p style={{ color:red, fontSize:11, fontWeight:600 }}>⚠ SMTP Error: {email.error_message}</p>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto' }}>
        {bodyHtml ? (
          <iframe
            ref={iframeRef}
            sandbox="allow-same-origin"
            style={{ width:'100%', height:'100%', border:'none', background:'#fff' }}
            srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;font-size:14px;color:#222;padding:16px;margin:0;word-break:break-word;}a{color:#1a56db;}img{max-width:100%;height:auto;}</style></head><body>${bodyHtml}</body></html>`}
          />
        ) : email.dmarc ? (
          // A DMARC report's body is empty BY DESIGN — the report is the
          // attachment. Show what it says instead of "(empty body)".
          <DmarcPanel dmarc={email.dmarc} />
        ) : (email.text || email.content) ? (
          <pre style={{ padding:'20px 22px', color:'rgba(245,240,232,0.7)', fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>
            {email.text || email.content}
          </pre>
        ) : (
          <div style={{ padding:'40px 22px', textAlign:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
            <p style={{ fontSize:28, marginBottom:10 }}>📄</p>
            <p>{isLogEmail ? 'No stored copy of this email body.' : '(empty body)'}</p>
          </div>
        )}
      </div>

      {/* Attachments */}
      {!isLogEmail && email.attachments && email.attachments.length > 0 && (
        <AttachmentsPanel attachments={email.attachments} email={email} adminApi={adminApi} toast={toast} />
      )}
    </div>
  );
}

// Small icon-button used in EmailDetail toolbar
function ToolBtn({ icon, label, onClick, color, active }) {
  return (
    <button onClick={onClick} title={label} style={{
      background: active ? 'rgba(251,191,36,0.12)' : 'none',
      border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:6,
      color: color || (active ? '#FBBF24' : 'rgba(245,240,232,0.5)'),
      fontSize:14, lineHeight:1, transition:'color 0.12s, background 0.12s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = color || ivory}
      onMouseLeave={e => e.currentTarget.style.color = color || (active ? '#FBBF24' : 'rgba(245,240,232,0.5)')}
    >
      {icon}
    </button>
  );
}

// ─── File type icon helper ────────────────────────────────────────────────────
function fileIcon(contentType = '', filename = '') {
  const t = contentType.toLowerCase();
  const ext = (filename.match(/\.([^.]+)$/) || ['',''])[1].toLowerCase();
  if (t.startsWith('image/'))  return '🖼️';
  if (t.startsWith('video/'))  return '🎬';
  if (t.startsWith('audio/'))  return '🎵';
  if (t.includes('pdf'))       return '📄';
  if (t.includes('zip') || t.includes('rar') || t.includes('7z') || ext === 'zip') return '📦';
  if (t.includes('word') || ext === 'doc' || ext === 'docx')  return '📝';
  if (t.includes('excel') || t.includes('spreadsheet') || ext === 'xlsx' || ext === 'csv') return '📊';
  if (t.includes('presentation') || ext === 'pptx' || ext === 'ppt') return '📊';
  if (t.startsWith('text/'))   return '📃';
  if (t.includes('x-ms') || t.includes('executable')) return '⚠️';
  return '📎';
}

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1048576)     return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
}

// ─── Email row ────────────────────────────────────────────────────────────────
function EmailRow({ email, selected, onClick, onStar }) {
  const unread   = email.seen === false;
  const starred  = email.starred === true;
  return (
    <div onClick={onClick} style={{
      padding:'10px 12px 10px 14px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)',
      background: selected ? 'rgba(212,175,55,0.08)' : unread ? 'rgba(255,255,255,0.025)' : 'transparent',
      borderLeft: selected ? `3px solid ${gold}` : '3px solid transparent',
      transition:'background 0.12s', position:'relative',
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background='rgba(255,255,255,0.035)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background=unread?'rgba(255,255,255,0.025)':'transparent'; }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
        {/* Star */}
        <button onClick={e => { e.stopPropagation(); onStar && onStar(email, !starred); }} style={{
          background:'none', border:'none', cursor:'pointer', padding:'1px 2px', fontSize:13, lineHeight:1,
          color: starred ? '#FBBF24' : 'rgba(245,240,232,0.18)', flexShrink:0, marginTop:1,
        }} title={starred ? 'Unstar' : 'Star'}>
          {starred ? '★' : '☆'}
        </button>
        {/* Unread dot */}
        <span style={{ width:6, height:6, borderRadius:'50%', background: unread ? gold : 'transparent', flexShrink:0, marginTop:5 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:2 }}>
            <span style={{ color: unread ? ivory : 'rgba(245,240,232,0.65)', fontSize:12, fontWeight: unread ? 700 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
              {typeof email.from === 'object' ? (email.from?.name || email.from?.address || email.to_email || '—') : (email.from || email.to_email || '—')}
            </span>
            <span style={{ color:'rgba(245,240,232,0.3)', fontSize:10, flexShrink:0 }}>{fmt(email.date || email.created_at)}</span>
          </div>
          <p style={{ color: unread ? 'rgba(245,240,232,0.8)' : 'rgba(245,240,232,0.5)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3, fontWeight: unread ? 600 : 400 }}>
            {email.subject || '(no subject)'}
          </p>
          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap' }}>
            {email.dept && <Badge dept={email.dept} />}
            {email.status && <StatusBadge status={email.status} />}
            {/* Automated domain-authentication report, not correspondence — label
                it so a daily machine message is not mistaken for a customer. */}
            {email.is_dmarc && (
              <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
                color:'#93C5FD', background:'rgba(147,197,253,0.1)', border:'1px solid rgba(147,197,253,0.25)',
                borderRadius:4, padding:'1px 5px' }}>
                DMARC
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function EmailManager() {
  const [activeDept,   setActiveDept]   = useState('all');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails,       setEmails]       = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [selectedId,   setSelectedId]   = useState(null);
  const [detail,       setDetail]       = useState(null);
  const [detailLoading,setDetailL]      = useState(false);
  const [composeOpen,  setCompose]      = useState(false);
  const [replyData,    setReplyData]    = useState(null);
  const [search,       setSearch]       = useState('');
  const [signatures,   setSignatures]   = useState({});
  const [retrying,     setRetrying]     = useState({});
  const [unreadCounts, setUnreadCounts] = useState({ all: 0, sales: 0, team: 0, account: 0, legal: 0 });
  const [starring,     setStarring]     = useState({});
  const [deleting,     setDeleting]     = useState({});

  // Load signatures once
  useEffect(() => {
    adminApi.get('/admin/email-signatures').then(({ data }) => setSignatures(data.signatures || {})).catch(() => {});
  }, []);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/admin/email-manager/unread-counts');
      setUnreadCounts(data.counts || {});
    } catch (_) {}
  }, []);

  const loadEmails = useCallback(async () => {
    setLoading(true);
    setSelectedId(null);
    setDetail(null);
    try {
      if (activeFolder === 'inbox') {
        const { data } = await adminApi.get('/admin/email-manager/inbox', {
          params: { dept: activeDept, page },
        });
        setEmails(data.emails || []);
        setTotal(data.total || 0);
      } else if (activeFolder === 'starred') {
        const { data } = await adminApi.get('/admin/email-manager/starred', {
          params: { dept: activeDept },
        });
        setEmails(data.emails || []);
        setTotal(data.total || 0);
      } else {
        // sent / failed / retried come from email_logs
        const statusMap = { sent:'sent', failed:'failed', retried:'retried' };
        const { data } = await adminApi.get('/admin/email-logs', {
          params: {
            dept:   activeDept === 'all' ? undefined : activeDept,
            status: statusMap[activeFolder] || '',
            page,
          },
        });
        setEmails(data.logs || []);
        setTotal(Number(data.pagination?.total) || 0);
      }
    } catch { toast.error('Failed to load emails'); }
    finally { setLoading(false); }
  }, [activeDept, activeFolder, page]);

  useEffect(() => { loadEmails(); loadUnreadCounts(); }, [loadEmails, loadUnreadCounts]);

  const doRefresh = () => { loadEmails(); loadUnreadCounts(); };

  const selectEmail = async (email) => {
    const id = email.uid || email.id;
    setSelectedId(id);

    if (activeFolder === 'inbox' || activeFolder === 'starred') {
      setDetailL(true);
      // Optimistically mark as read in the list
      setEmails(es => es.map(e => (e.uid === email.uid && e.dept === email.dept) ? { ...e, seen: true } : e));
      try {
        const { data } = await adminApi.get(`/admin/email-manager/inbox/${email.dept}/${email.uid}`);
        setDetail({ ...data.email, dept: email.dept });
        setUnreadCounts(c => ({
          ...c,
          [email.dept]: Math.max(0, (c[email.dept] || 0) - (email.seen === false ? 1 : 0)),
          all: Math.max(0, (c.all || 0) - (email.seen === false ? 1 : 0)),
        }));
      } catch { toast.error('Could not load email'); setDetail(email); }
      finally { setDetailL(false); }
    } else {
      // email_logs — fetch the full row (html_body is excluded from the list query
      // for performance), then map log columns to the fields EmailDetail expects.
      setDetailL(true);
      try {
        const { data } = await adminApi.get(`/admin/email-logs/${email.id}`);
        const log = data.log || email;
        setDetail({
          ...log,
          _isLog:    true,
          from:      log.from_address || log.department || '',
          to:        log.to_email,
          date:      log.created_at,
          html_body: log.html_body || '',
        });
      } catch {
        toast.error('Could not load email');
        setDetail({ ...email, _isLog:true, from: email.from_address, to: email.to_email, date: email.created_at });
      } finally { setDetailL(false); }
    }
  };

  const retry = async (logId, e) => {
    e.stopPropagation();
    setRetrying(r => ({ ...r, [logId]: true }));
    try {
      await adminApi.post(`/admin/email-logs/${logId}/retry`);
      toast.success('Email re-sent!');
      loadEmails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send again');
    } finally {
      setRetrying(r => ({ ...r, [logId]: false }));
    }
  };

  const handleReply = (email) => {
    setReplyData(email);
    setCompose(true);
  };

  const handleStar = async (email, starred) => {
    const key = `${email.dept}:${email.uid}`;
    if (starring[key]) return;
    setStarring(s => ({ ...s, [key]: true }));
    // Optimistic update
    setEmails(es => es.map(e => (e.uid === email.uid && e.dept === email.dept) ? { ...e, starred } : e));
    if (detail?.uid === email.uid) setDetail(d => ({ ...d, starred }));
    try {
      await adminApi.patch(`/admin/email-manager/inbox/${email.dept}/${email.uid}/star`, { starred });
      toast.success(starred ? 'Starred' : 'Unstarred');
    } catch {
      // Roll back
      setEmails(es => es.map(e => (e.uid === email.uid && e.dept === email.dept) ? { ...e, starred: !starred } : e));
      if (detail?.uid === email.uid) setDetail(d => ({ ...d, starred: !starred }));
      toast.error('Could not update star');
    } finally { setStarring(s => ({ ...s, [key]: false })); }
  };

  const handleMarkUnread = async (email) => {
    try {
      await adminApi.patch(`/admin/email-manager/inbox/${email.dept}/${email.uid}/seen`, { seen: false });
      setEmails(es => es.map(e => (e.uid === email.uid && e.dept === email.dept) ? { ...e, seen: false } : e));
      setDetail(d => d?.uid === email.uid ? { ...d, seen: false } : d);
      setUnreadCounts(c => ({ ...c, [email.dept]: (c[email.dept] || 0) + 1, all: (c.all || 0) + 1 }));
      toast.success('Marked as unread');
    } catch { toast.error('Could not mark as unread'); }
  };

  const handleDelete = async (email) => {
    const key = `${email.dept}:${email.uid}`;
    if (deleting[key]) return;
    if (!window.confirm(`Delete this email?\n"${email.subject}"`)) return;
    setDeleting(d => ({ ...d, [key]: true }));
    try {
      await adminApi.delete(`/admin/email-manager/inbox/${email.dept}/${email.uid}`);
      setEmails(es => es.filter(e => !(e.uid === email.uid && e.dept === email.dept)));
      setDetail(null); setSelectedId(null);
      toast.success('Email deleted');
    } catch { toast.error('Could not delete email'); }
    finally { setDeleting(d => ({ ...d, [key]: false })); }
  };

  const filtered = search
    ? emails.filter(e => {
        const q = search.toLowerCase();
        const from = typeof e.from === 'object' ? `${e.from?.name} ${e.from?.address}` : (e.from || e.to_email || '');
        return (e.subject || '').toLowerCase().includes(q) || from.toLowerCase().includes(q);
      })
    : emails;

  const DEPT_TABS = [
    { key:'all',     label:'🌐 All',       color: DEPT_COLOR.all     },
    { key:'sales',   label:'💼 Sales',     color: DEPT_COLOR.sales   },
    { key:'team',    label:'🤝 Support',   color: DEPT_COLOR.team    },
    { key:'account', label:'🏦 Accounts',  color: DEPT_COLOR.account },
    { key:'legal',   label:'⚖️ Legal',     color: DEPT_COLOR.legal   },
  ];

  const FOLDER_TABS = [
    { key:'inbox',   label:'📥 Inbox'   },
    { key:'starred', label:'⭐ Starred'  },
    { key:'sent',    label:'📤 Sent'    },
    { key:'failed',  label:'❌ Failed'  },
    { key:'retried', label:'🔄 Resent'  },
  ];

  return (
    <div className="email-manager-root" style={{ display:'flex', height:'calc(100vh - 86px)', overflow:'hidden', background:'#0A0C18', gap:0 }}>
      <style>{`@keyframes email-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="email-manager-mobile-toolbar">
        <button onClick={() => { setReplyData(null); setCompose(true); }} aria-label="Compose email">✏️</button>
        <select value={activeDept} onChange={(event) => { setActiveDept(event.target.value); setPage(1); }} aria-label="Email account">
          {DEPT_TABS.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
        </select>
        <select value={activeFolder} onChange={(event) => { setActiveFolder(event.target.value); setPage(1); }} aria-label="Email folder">
          {FOLDER_TABS.map((tab) => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
        </select>
      </div>

      {/* ── Left Sidebar ──────────────────────────────────────────────────────── */}
      <div className="email-manager-sidebar" style={{ width:192, flexShrink:0, borderRight:'1px solid rgba(212,175,55,0.1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Compose */}
        <div style={{ padding:'14px 12px', borderBottom:'1px solid rgba(212,175,55,0.08)' }}>
          <button onClick={() => { setReplyData(null); setCompose(true); }} style={{
            width:'100%', padding:'9px 0', borderRadius:8, border:`1px solid ${gold}44`,
            background:`linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.06))`,
            color:gold, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <span style={{ fontSize:15 }}>✏️</span> Compose
          </button>
        </div>

        {/* Dept selector */}
        <div style={{ padding:'10px 8px 6px' }}>
          <p style={{ color:'rgba(245,240,232,0.22)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6, paddingLeft:6 }}>Accounts</p>
          {DEPT_TABS.map(t => {
            const uc = t.key === 'all' ? (unreadCounts.all || 0) : (unreadCounts[t.key] || 0);
            return (
              <button key={t.key} onClick={() => { setActiveDept(t.key); setPage(1); }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:6,
                background: activeDept===t.key ? `${t.color}12` : 'transparent',
                border:'none', color: activeDept===t.key ? t.color : 'rgba(245,240,232,0.45)',
                fontSize:12, fontWeight: activeDept===t.key ? 700 : 400, cursor:'pointer', textAlign:'left',
                borderLeft: activeDept===t.key ? `2px solid ${t.color}` : '2px solid transparent',
                transition:'all 0.12s',
              }}>
                <span style={{ flex:1 }}>{t.label}</span>
                {uc > 0 && (
                  <span style={{ background: t.color, color:'#0A0C18', borderRadius:10, fontSize:9, fontWeight:800, padding:'1px 5px', minWidth:14, textAlign:'center', lineHeight:1.6 }}>
                    {uc}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Test SMTP */}
        <SmtpTestPanel />

        {/* Folder selector */}
        <div style={{ padding:'8px 8px 6px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color:'rgba(245,240,232,0.22)', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:6, paddingLeft:6 }}>Folders</p>
          {FOLDER_TABS.map(t => {
            const inboxUnread = t.key === 'inbox' ? (unreadCounts.all || 0) : 0;
            return (
              <button key={t.key} onClick={() => { setActiveFolder(t.key); setPage(1); }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:6,
                background: activeFolder===t.key ? 'rgba(212,175,55,0.08)' : 'transparent',
                border:'none', color: activeFolder===t.key ? gold : 'rgba(245,240,232,0.45)',
                fontSize:12, fontWeight: activeFolder===t.key ? 700 : 400, cursor:'pointer', textAlign:'left',
                borderLeft: activeFolder===t.key ? `2px solid ${gold}` : '2px solid transparent',
                transition:'all 0.12s',
              }}>
                <span style={{ flex:1 }}>{t.label}</span>
                {inboxUnread > 0 && (
                  <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, fontSize:9, fontWeight:800, padding:'1px 5px', minWidth:14, textAlign:'center', lineHeight:1.6 }}>
                    {inboxUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Email List ────────────────────────────────────────────────────────── */}
      <div className={`email-manager-list ${detail || detailLoading ? 'email-manager-mobile-hidden' : ''}`} style={{ width:320, flexShrink:0, borderRight:'1px solid rgba(212,175,55,0.1)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* List header */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ color:gold, fontSize:13, fontWeight:700 }}>{DEPT_LABEL[activeDept]} · {activeFolder.charAt(0).toUpperCase()+activeFolder.slice(1)}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {activeFolder === 'inbox' && (unreadCounts[activeDept] || (activeDept === 'all' ? unreadCounts.all : 0) || 0) > 0 && (
                <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 7px' }}>
                  {activeDept === 'all' ? unreadCounts.all : unreadCounts[activeDept]} unread
                </span>
              )}
              <span style={{ color:'rgba(245,240,232,0.3)', fontSize:11 }}>{total} emails</span>
              <button onClick={doRefresh} disabled={loading} title="Refresh emails" style={{
                background:'none', border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? gold : 'rgba(245,240,232,0.45)', fontSize:17, lineHeight:1,
                padding:'0 2px', display:'flex', alignItems:'center',
              }}>
                <span style={{ display:'inline-block', animation: loading ? 'email-spin 0.7s linear infinite' : 'none' }}>↻</span>
              </button>
            </div>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search…"
            style={{ width:'100%', boxSizing:'border-box', padding:'7px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:ivory, fontSize:12, outline:'none' }}
          />
        </div>

        {/* List body */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            Array.from({length:6}).map((_,i) => (
              <div key={i} style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', opacity:0.4-i*0.05 }}>
                <div style={{ height:10, background:'rgba(255,255,255,0.08)', borderRadius:4, marginBottom:6, width:'60%' }} />
                <div style={{ height:8,  background:'rgba(255,255,255,0.05)', borderRadius:4, width:'85%' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'rgba(245,240,232,0.25)', fontSize:13 }}>
              {activeFolder === 'inbox' ? '📭 Inbox empty' : activeFolder === 'starred' ? '⭐ No starred emails' : `No ${activeFolder} emails`}
            </div>
          ) : filtered.map(email => {
            const id = email.uid || email.id;
            return (
              <div key={id} style={{ position:'relative' }}>
                <EmailRow
                  email={email}
                  selected={selectedId === id}
                  onClick={() => selectEmail(email)}
                  onStar={handleStar}
                />
                {/* Send-again button for failed/queued emails in list */}
                {(email.status === 'failed' || email.status === 'queued') && (
                  <button
                    onClick={e => retry(email.id, e)}
                    disabled={retrying[email.id]}
                    title="Send this email again"
                    style={{
                      position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      padding:'3px 9px', borderRadius:5, border:`1px solid ${gold}55`, background:`${gold}12`,
                      color:gold, fontSize:10, fontWeight:700, cursor:'pointer', zIndex:2, whiteSpace:'nowrap',
                    }}
                  >
                    {retrying[email.id] ? '…' : '✉️ Send again'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {total > 30 && (
          <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color: page===1?'rgba(245,240,232,0.2)':gold, cursor:page===1?'default':'pointer', fontSize:12 }}>←</button>
            <span style={{ color:'rgba(245,240,232,0.35)', fontSize:11 }}>{page} / {Math.ceil(total/30)||1}</span>
            <button disabled={page*30>=total} onClick={() => setPage(p=>p+1)} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(212,175,55,0.2)', background:'transparent', color:page*30>=total?'rgba(245,240,232,0.2)':gold, cursor:page*30>=total?'default':'pointer', fontSize:12 }}>→</button>
          </div>
        )}
      </div>

      {/* ── Email Detail ──────────────────────────────────────────────────────── */}
      <div className={`email-manager-detail ${!detail && !detailLoading ? 'email-manager-mobile-hidden' : ''}`} style={{ flex:1, display:'flex', minWidth:0, overflow:'hidden', background:'#0F1120' }}>
        {detailLoading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
            ⏳ Loading email…
          </div>
        ) : (
          <EmailDetail
            email={detail}
            folder={activeFolder}
            onReply={handleReply}
            onClose={() => { setDetail(null); setSelectedId(null); }}
            onStar={handleStar}
            onMarkUnread={handleMarkUnread}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* ── Compose Modal ─────────────────────────────────────────────────────── */}
      {composeOpen && (
        <ComposeModal
          onClose={() => setCompose(false)}
          onSent={loadEmails}
          signatures={signatures}
          defaultDept={replyData?.dept || activeDept === 'all' ? 'team' : activeDept}
        />
      )}
    </div>
  );
}
