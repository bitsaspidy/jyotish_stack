'use client';
import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

// ── Plan Edit Modal ───────────────────────────────────────────────────────────
function PlanModal({ plan, onClose, onSaved }) {
  const isNew = !plan?.id;
  const [form, setForm] = useState(
    plan
      ? { ...plan, features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features) : []) }
      : { name:'', name_hi:'', description:'', price:0, currency:'INR', duration_days:30, features:[], is_active:true }
  );
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addFeature = () => {
    if (!newFeature.trim()) return;
    set('features', [...form.features, newFeature.trim()]);
    setNewFeature('');
  };
  const removeFeature = (i) => set('features', form.features.filter((_, fi) => fi !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error('Name and price required');
    setSaving(true);
    try {
      if (isNew) {
        await adminApi.post('/admin/plans', form);
        toast.success('Plan created');
      } else {
        await adminApi.patch(`/admin/plans/${plan.id}`, form);
        toast.success('Plan updated');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'28px', width:'100%', maxWidth:500, boxShadow:'0 24px 60px rgba(0,0,0,0.7)', overflowY:'auto', maxHeight:'90vh' }}>
        <h2 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:22 }}>
          {isNew ? '➕ Create New Plan' : `✏️ Edit — ${plan.name}`}
        </h2>
        <form onSubmit={submit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {[
              { key:'name',     label:'Plan Name (EN)',  type:'text'   },
              { key:'name_hi',  label:'Plan Name (HI)',  type:'text'   },
              { key:'price',    label:'Price (₹)',        type:'number' },
              { key:'duration_days', label:'Duration (days)', type:'number' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</label>
                <input type={type} value={form[key] ?? ''} onChange={e => set(key, type==='number' ? Number(e.target.value) : e.target.value)}
                  style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 11px', fontSize:13, outline:'none' }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Description</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
              style={{ width:'100%', boxSizing:'border-box', background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'8px 11px', fontSize:13, outline:'none', resize:'vertical' }} />
          </div>

          {/* Features */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', color:'rgba(245,240,232,0.45)', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Features</label>
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
              {form.features.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(212,175,55,0.06)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:6, padding:'6px 10px' }}>
                  <span style={{ color:'#D4AF37', fontSize:12 }}>✦</span>
                  <span style={{ flex:1, color:'rgba(245,240,232,0.75)', fontSize:12 }}>{f}</span>
                  <button type="button" onClick={() => removeFeature(i)} style={{ background:'transparent', border:'none', color:'rgba(239,68,68,0.6)', fontSize:12, cursor:'pointer', padding:'0 2px' }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input placeholder="Add feature…" value={newFeature} onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                style={{ flex:1, background:'#0D0F1E', border:'1px solid rgba(212,175,55,0.18)', borderRadius:6, color:'#F5F0E8', padding:'7px 11px', fontSize:13, outline:'none' }} />
              <button type="button" onClick={addFeature} style={{ padding:'7px 14px', borderRadius:6, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', color:'#D4AF37', fontSize:12, cursor:'pointer' }}>
                + Add
              </button>
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              style={{ width:40, height:22, borderRadius:11, background: form.is_active ? '#D4AF37' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <span style={{ position:'absolute', top:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', left: form.is_active ? 20 : 2 }} />
            </button>
            <span style={{ color:'rgba(245,240,232,0.6)', fontSize:13 }}>Plan is {form.is_active ? 'Active' : 'Inactive'}</span>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'8px 18px', borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(245,240,232,0.55)', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding:'8px 22px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : isNew ? 'Create Plan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Plans View ───────────────────────────────────────────────────────────
export default function Plans() {
  const [plans,  setPlans]  = useState([]);
  const [modal,  setModal]  = useState(null); // null | {} (new) | plan (edit)
  const [loading, setLoading] = useState(true);

  const fetchPlans = () => {
    adminApi.get('/admin/plans')
      .then(({ data }) => setPlans(data.plans))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const toggleActive = async (p) => {
    try {
      await adminApi.patch(`/admin/plans/${p.id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? 'Plan deactivated' : 'Plan activated');
      fetchPlans();
    } catch { toast.error('Failed'); }
  };

  const ACCENT = ['#D4AF37','#A78BFA','#34D399','#60A5FA'];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:'#D4AF37', fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:3 }}>Subscription Plans</h1>
          <p style={{ color:'rgba(245,240,232,0.38)', fontSize:13 }}>{plans.length} plan{plans.length!==1?'s':''} configured</p>
        </div>
        <button onClick={() => setModal({})}
          style={{ padding:'9px 20px', borderRadius:6, background:'linear-gradient(135deg,#D4AF37,#F0D060,#A88B20)', border:'none', color:'#0B0D1A', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          ＋ New Plan
        </button>
      </div>

      {loading ? (
        <div className="admin-auto-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:280, background:'rgba(255,255,255,0.04)', borderRadius:8, animation:'pulse 1.5s infinite' }} />)}
        </div>
      ) : (
        <div className="admin-auto-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {plans.map((p, idx) => {
            const features = Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features||'[]') : []);
            const accent   = ACCENT[idx % ACCENT.length];
            return (
              <div key={p.id} style={{ background:'#111428', border:'1px solid rgba(212,175,55,0.12)', borderTop:`3px solid ${accent}`, borderRadius:8, padding:'22px 20px', display:'flex', flexDirection:'column' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
                  <div>
                    <h3 style={{ color:'#F5F0E8', fontSize:16, fontWeight:700, lineHeight:1.3 }}>{p.name}</h3>
                    {p.name_hi && <p style={{ color:'rgba(245,240,232,0.38)', fontSize:12 }}>{p.name_hi}</p>}
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600, background: p.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)', color: p.is_active ? '#34D399' : '#F87171', border:`1px solid ${p.is_active ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Price */}
                <div style={{ marginBottom:8 }}>
                  <span style={{ color:accent, fontSize:28, fontWeight:800 }}>₹{p.price}</span>
                  <span style={{ color:'rgba(245,240,232,0.38)', fontSize:12, marginLeft:5 }}>/ {p.duration_days} days</span>
                </div>
                {p.description && <p style={{ color:'rgba(245,240,232,0.45)', fontSize:12, marginBottom:14, lineHeight:1.5 }}>{p.description}</p>}

                {/* Features */}
                <ul style={{ flex:1, marginBottom:18, listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:5 }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:7, color:'rgba(245,240,232,0.65)', fontSize:12, lineHeight:1.45 }}>
                      <span style={{ color:accent, flexShrink:0, marginTop:1 }}>✦</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setModal(p)}
                    style={{ flex:1, padding:'7px', borderRadius:6, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.25)', color:'#D4AF37', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => toggleActive(p)}
                    style={{ flex:1, padding:'7px', borderRadius:6, background: p.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)', border:`1px solid ${p.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(52,211,153,0.25)'}`, color: p.is_active ? '#F87171' : '#34D399', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && <PlanModal plan={Object.keys(modal).length > 0 ? modal : null} onClose={() => setModal(null)} onSaved={fetchPlans} />}
    </div>
  );
}
