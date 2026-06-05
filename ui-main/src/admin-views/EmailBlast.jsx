'use client';
import { useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id:'blank',        label:'Blank', body:'<p>Your message here...</p>' },
  { id:'announcement', label:'Announcement', body:`<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
  <h1 style="color:#D4AF37;font-size:26px;margin-bottom:12px;">Important Announcement</h1>
  <p style="font-size:15px;line-height:1.7;color:#444;">We have exciting news to share with you regarding your Jyotish Stack AI experience.</p>
  <p style="font-size:15px;line-height:1.7;color:#444;">Your message here...</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="font-size:12px;color:#888;">— Team Jyotish Stack AI</p>
</div>` },
  { id:'welcome',      label:'Welcome', body:`<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a2e;">
  <h1 style="color:#D4AF37;font-size:26px;">🪐 Welcome to Jyotish Stack AI</h1>
  <p style="font-size:15px;line-height:1.7;color:#444;">Dear {{name}},<br>We're delighted to have you with us. Your journey through the stars begins now.</p>
  <a href="https://jyotishstack.com/kundli" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">Create Your Kundli →</a>
</div>` },
];

export default function EmailBlast() {
  const [target,    setTarget]    = useState('all');
  const [userIds,   setUserIds]   = useState('');
  const [subject,   setSubject]   = useState('');
  const [body,      setBody]      = useState(TEMPLATES[0].body);
  const [activeTab, setActiveTab] = useState('compose');
  const [sending,   setSending]   = useState(false);

  const applyTemplate = (t) => {
    setBody(t.body);
    setActiveTab('compose');
    toast.success(`Template "${t.label}" applied`);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error('Subject is required');
    if (!body.trim())    return toast.error('Body is required');

    const confirmed = window.confirm(`Send email to ${target === 'all' ? 'ALL active users' : 'selected users'}?`);
    if (!confirmed) return;

    setSending(true);
    try {
      const payload = { subject, body };
      if (target === 'all') {
        payload.all_users = true;
      } else {
        payload.user_ids = userIds.split(',').map(id => id.trim()).filter(Boolean).map(Number);
      }
      const { data } = await adminApi.post('/admin/send-email', payload);
      toast.success(data.message || 'Email queued successfully');
      setSubject(''); setBody(TEMPLATES[0].body); setUserIds('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Email Blast</h1>
        <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>Send bulk emails to users or segments</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, alignItems:'start' }}>
        {/* ── Compose Panel ─────────────────────────────────────────────── */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, overflow:'hidden' }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(212,175,55,0.1)' }}>
            {[['compose','✍️ Compose'],['preview','👁 Preview']].map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding:'11px 20px', fontSize:13, fontWeight:600, cursor:'pointer',
                background: activeTab===key ? 'rgba(212,175,55,0.08)' : 'transparent',
                color: activeTab===key ? '#D4AF37' : 'rgba(245,240,232,0.45)',
                border:'none', borderBottom: activeTab===key ? '2px solid #D4AF37' : '2px solid transparent',
                transition:'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding:'22px' }}>
            {activeTab === 'compose' ? (
              <form onSubmit={send} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Recipients */}
                <div>
                  <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Recipients</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[['all','All Active Users'],['specific','Specific IDs']].map(([v,l]) => (
                      <button key={v} type="button" onClick={() => setTarget(v)} style={{
                        padding:'7px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                        background: target===v ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                        border:`1px solid ${target===v ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: target===v ? '#D4AF37' : 'rgba(245,240,232,0.5)',
                      }}>{l}</button>
                    ))}
                  </div>
                  {target === 'specific' && (
                    <input value={userIds} onChange={e => setUserIds(e.target.value)}
                      placeholder="User IDs comma-separated: 1, 2, 3…"
                      style={{ width:'100%', boxSizing:'border-box', marginTop:10, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 12px', fontSize:13, outline:'none' }} />
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Subject Line</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your email subject…"
                    style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'9px 12px', fontSize:13, outline:'none' }} />
                </div>

                {/* Body */}
                <div>
                  <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                    HTML Body <span style={{ color:'rgba(245,240,232,0.25)', textTransform:'none', fontWeight:400 }}>{'— use {{name}} for personalization'}</span>
                  </label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
                    style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'9px 12px', fontSize:12, outline:'none', resize:'vertical', fontFamily:'monospace', lineHeight:1.65 }} />
                </div>

                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <button type="button" onClick={() => setActiveTab('preview')}
                    style={{ padding:'9px 18px', borderRadius:6, border:'1px solid rgba(212,175,55,0.25)', background:'transparent', color:'#D4AF37', fontSize:13, cursor:'pointer' }}>
                    Preview →
                  </button>
                  <button type="submit" disabled={sending}
                    style={{ padding:'9px 24px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? '⏳ Queueing…' : '📧 Send Email Blast'}
                  </button>
                </div>
              </form>
            ) : (
              /* Preview */
              <div>
                <div style={{ background:'#1A1E38', border:'1px solid rgba(212,175,55,0.15)', borderRadius:8, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)' }}>
                    <p style={{ color:'rgba(245,240,232,0.4)', fontSize:11 }}>
                      To: <span style={{ color:'#F5F0E8', fontWeight:600 }}>{target==='all' ? 'All Active Users' : `User IDs: ${userIds || 'none'}`}</span>
                      {'  ·  '}Subject: <span style={{ color:'#F5F0E8', fontWeight:600 }}>{subject || '(no subject)'}</span>
                    </p>
                  </div>
                  <div style={{ padding:'20px', minHeight:200, background:'#fff' }}>
                    {body
                      ? <div dangerouslySetInnerHTML={{ __html: body }} />
                      : <p style={{ color:'#999', fontSize:13 }}>No content yet…</p>
                    }
                  </div>
                </div>
                <button onClick={() => setActiveTab('compose')}
                  style={{ padding:'8px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:13, cursor:'pointer' }}>
                  ← Back to Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Templates Sidebar ─────────────────────────────────────────── */}
        <div style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, padding:'18px' }}>
          <h3 style={{ color:'#F5F0E8', fontSize:14, fontWeight:600, marginBottom:14 }}>📋 Templates</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t)}
                style={{ padding:'10px 14px', borderRadius:7, border:'1px solid rgba(212,175,55,0.15)', background:'rgba(212,175,55,0.04)', color:'rgba(245,240,232,0.7)', fontSize:13, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(212,175,55,0.4)'; e.currentTarget.style.background='rgba(212,175,55,0.1)'; e.currentTarget.style.color='#D4AF37'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(212,175,55,0.15)'; e.currentTarget.style.background='rgba(212,175,55,0.04)'; e.currentTarget.style.color='rgba(245,240,232,0.7)'; }}>
                📄 {t.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop:20, padding:'14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8 }}>
            <p style={{ color:'#FBBF24', fontSize:11, fontWeight:700, marginBottom:5 }}>⚠ Important</p>
            <p style={{ color:'rgba(245,240,232,0.5)', fontSize:11, lineHeight:1.6 }}>
              Emails are fire-and-forget. Large sends may take several minutes. Avoid resending to prevent duplicate emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
