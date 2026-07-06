'use client';
import { useEffect, useState, useCallback } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

function Stars({ n }) {
  return <span style={{ color:GOLD, fontSize:13 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

function Btn({ children, onClick, color = GOLD, outline = false, small = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? 'transparent' : color, color: outline ? color : '#0A0C18',
      border:`1px solid ${color}`, borderRadius:6, fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontSize: small ? 11 : 13, padding: small ? '4px 10px' : '8px 16px', transition:'all 0.15s',
    }}>{children}</button>
  );
}

function TestimonialModal({ item, onClose, onSaved }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState({
    name:        item?.name        || '',
    role:        item?.role        || '',
    location:    item?.location    || '',
    content:     item?.content     || '',
    rating:      item?.rating      || 5,
    avatar:      item?.avatar      || '',
    is_featured: item?.is_featured || false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) return toast.error('Name and content required');
    setSaving(true);
    try {
      if (isEdit) await adminApi.put(`/admin/testimonials/${item.id}`, form);
      else        await adminApi.post('/admin/testimonials', form);
      toast.success(isEdit ? 'Updated' : 'Added');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center',
      justifyContent:'center', padding:20 }}>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)',
        borderRadius:12, padding:'28px', width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.7)' }}>
        <h2 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:20 }}>
          {isEdit ? '✏️ Edit Testimonial' : '⭐ New Testimonial'}
        </h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['Name *','name','text','Customer name'],['Role','role','text','e.g. Software Engineer'],
            ['Location','location','text','e.g. Mumbai, India'],['Avatar URL','avatar','text','https://…']].map(([lbl, key, type, ph]) => (
            <div key={key}>
              <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{lbl}</label>
              <input type={type} value={form[key]} placeholder={ph} onChange={e => set(key, e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                  borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', boxSizing:'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Testimonial *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={4}
              placeholder="What the customer said…"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <div>
              <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Rating</label>
              <select value={form.rating} onChange={e => set('rating', parseInt(e.target.value))}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                  borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px' }}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:20 }}>
              <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)}
                style={{ width:14, height:14, accentColor:GOLD }} />
              <span style={{ color:DIM, fontSize:13 }}>Featured on homepage</span>
            </label>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <Btn outline onClick={onClose}>Cancel</Btn>
            <Btn disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Testimonial'}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [modal, setModal]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await adminApi.get('/admin/testimonials');
      setItems(r.data?.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    try { await adminApi.delete(`/admin/testimonials/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>⭐ Testimonials</h1>
          <p style={{ color:DIM, fontSize:13 }}>Customer reviews shown on the homepage</p>
        </div>
        <Btn onClick={() => setModal('new')}>+ Add Testimonial</Btn>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
          <p style={{ fontSize:40, marginBottom:12 }}>⭐</p>
          <p>No testimonials yet.</p>
        </div>
      ) : (
        <div className="admin-auto-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {items.map(t => (
            <div key={t.id} style={{ background:'rgba(255,255,255,0.02)',
              border:`1px solid ${t.is_featured ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.1)'}`,
              borderRadius:10, padding:'16px 18px' }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                ) : (
                  <div style={{ width:42, height:42, borderRadius:'50%', background:`${GOLD}20`,
                    border:`1px solid ${GOLD}40`, display:'flex', alignItems:'center', justifyContent:'center',
                    color:GOLD, fontWeight:700, fontSize:16, flexShrink:0 }}>
                    {t.name[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex:1 }}>
                  <p style={{ color:IVORY, fontWeight:700, fontSize:13, marginBottom:1 }}>{t.name}</p>
                  {t.role && <p style={{ color:DIM, fontSize:11 }}>{t.role}{t.location ? ` · ${t.location}` : ''}</p>}
                  <Stars n={t.rating || 5} />
                </div>
                {t.is_featured && (
                  <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:`${GOLD}18`,
                    color:GOLD, border:`1px solid ${GOLD}30`, fontWeight:700 }}>FEATURED</span>
                )}
              </div>
              <p style={{ color:DIM, fontSize:12, lineHeight:1.7, marginBottom:12 }}>"{t.content}"</p>
              <div style={{ display:'flex', gap:8 }}>
                <Btn small outline onClick={() => setModal(t)}>Edit</Btn>
                <Btn small outline color="#EF4444" onClick={() => del(t.id)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TestimonialModal
          item={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
