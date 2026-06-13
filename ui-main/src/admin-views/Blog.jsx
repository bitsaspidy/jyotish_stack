'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';

const GOLD = '#D4AF37';
const IVORY = '#F5F0E8';
const DIM = 'rgba(245,240,232,0.45)';

const STATUS_STYLE = {
  published: { bg:'rgba(34,197,94,0.12)',  color:'#22C55E', border:'rgba(34,197,94,0.28)'  },
  draft:     { bg:'rgba(107,114,128,0.12)', color:'#9CA3AF', border:'rgba(107,114,128,0.28)' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft;
  return (
    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:600,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`, textTransform:'capitalize' }}>
      {status}
    </span>
  );
}

function Btn({ children, onClick, color = GOLD, outline = false, small = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: outline ? 'transparent' : color,
      color:      outline ? color : '#0A0C18',
      border:`1px solid ${color}`,
      borderRadius:6, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: small ? 11 : 13,
      padding: small ? '4px 10px' : '8px 16px',
      transition:'all 0.15s',
    }}>
      {children}
    </button>
  );
}

function PostModal({ post, categories, onClose, onSaved }) {
  const isEdit = !!post?.id;
  const [form, setForm] = useState({
    title:           post?.title           || '',
    excerpt:         post?.excerpt          || '',
    content:         post?.content          || '',
    cover_image:     post?.cover_image      || '',
    category_id:     post?.category_id      || '',
    status:          post?.status           || 'draft',
    author:          post?.author           || '',
    seo_title:       post?.seo_title        || '',
    seo_description: post?.seo_description  || '',
    tags:            post?.tags             || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    try {
      if (isEdit) await adminApi.put(`/admin/blog/${post.id}`, form);
      else        await adminApi.post('/admin/blog', form);
      toast.success(isEdit ? 'Post updated' : 'Post created');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</label>
      <input type={type} value={form[key]} placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
          borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', boxSizing:'border-box' }} />
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-start',
      justifyContent:'center', padding:20, overflowY:'auto' }}>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)' }} />
      <div style={{ position:'relative', background:'#111428', border:'1px solid rgba(212,175,55,0.25)',
        borderRadius:12, padding:'28px 28px', width:'100%', maxWidth:680,
        boxShadow:'0 24px 60px rgba(0,0,0,0.7)', marginTop:20 }}>
        <h2 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:22 }}>
          {isEdit ? '✏️ Edit Post' : '✨ New Blog Post'}
        </h2>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {field('Title *', 'title', 'text', 'Astrology insight or article title')}
          {field('Author', 'author', 'text', 'Jyotish Stack')}
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Category</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px' }}>
              <option value="">— No category —</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px' }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Excerpt</label>
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2}
              placeholder="Short summary shown in card view"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Content (HTML)</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={10}
              placeholder="Full article content (HTML supported)"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:12, padding:'9px 12px', resize:'vertical',
                boxSizing:'border-box', fontFamily:'monospace' }} />
          </div>
          {field('Cover Image URL', 'cover_image', 'text', 'https://…')}
          {field('Tags', 'tags', 'text', 'saturn, dasha, kundli (comma-separated)')}
          {field('SEO Title', 'seo_title', 'text', 'Optional — overrides title in <head>')}
          <div>
            <label style={{ display:'block', color:DIM, fontSize:11, fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>SEO Description</label>
            <textarea value={form.seo_description} onChange={e => set('seo_description', e.target.value)} rows={2}
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
                borderRadius:6, color:IVORY, fontSize:13, padding:'9px 12px', resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <Btn outline onClick={onClose}>Cancel</Btn>
            <Btn disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update Post' : 'Create Post'}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlog() {
  const [posts, setPosts]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(null); // null | 'new' | postObj
  const [statusFilter, setStatusFilter] = useState('');
  const [catName, setCatName]     = useState('');
  const [pagination, setPagination] = useState(null);
  const [page, setPage]           = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit:20 };
      if (statusFilter) params.status = statusFilter;
      const [r, cats] = await Promise.all([
        adminApi.get('/admin/blog', { params }).then(r => r.data),
        adminApi.get('/admin/blog/categories').then(r => r.data),
      ]);
      setPosts(r.data || []);
      setPagination(r.pagination || null);
      setCategories(cats.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const deletePost = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await adminApi.delete(`/admin/blog/${id}`);
      toast.success('Post deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    try {
      await adminApi.post('/admin/blog/categories', { name: catName.trim() });
      toast.success('Category added');
      setCatName('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, marginBottom:2 }}>📝 Blog</h1>
          <p style={{ color:DIM, fontSize:13 }}>Manage astrology articles and posts</p>
        </div>
        <Btn onClick={() => setModal('new')}>+ New Post</Btn>
      </div>

      {/* Categories bar */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.1)',
        borderRadius:8, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ color:DIM, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Categories:</span>
        {categories.map(c => (
          <span key={c.id} style={{ fontSize:11, padding:'2px 10px', borderRadius:10,
            background:`${c.color}18`, color:c.color, border:`1px solid ${c.color}30`, fontWeight:600 }}>
            {c.name}
          </span>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <input value={catName} onChange={e => setCatName(e.target.value)}
            placeholder="New category…"
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(212,175,55,0.18)',
              borderRadius:5, color:IVORY, fontSize:12, padding:'5px 10px', width:150 }} />
          <Btn small onClick={addCategory}>Add</Btn>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['', 'published', 'draft'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ fontSize:12, padding:'5px 14px', borderRadius:20,
              background: statusFilter === s ? `${GOLD}1A` : 'transparent',
              color: statusFilter === s ? GOLD : DIM,
              border:`1px solid ${statusFilter === s ? GOLD + '40' : 'rgba(255,255,255,0.06)'}`,
              cursor:'pointer', fontWeight: statusFilter === s ? 600 : 400 }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:8, padding:'12px 16px', color:'#EF4444', fontSize:13, marginBottom:16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:DIM }}>
          <p style={{ fontSize:40, marginBottom:12 }}>📝</p>
          <p>No posts yet. Create your first astrology article.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {posts.map(p => (
            <div key={p.id} style={{ background:'rgba(255,255,255,0.02)',
              border:'1px solid rgba(212,175,55,0.1)', borderRadius:8, padding:'14px 18px',
              display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              {p.cover_image && (
                <img src={p.cover_image} alt="" style={{ width:56, height:40, objectFit:'cover', borderRadius:5, flexShrink:0 }} />
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:IVORY, fontWeight:600, fontSize:14, marginBottom:3,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <StatusBadge status={p.status} />
                  {p.category_name && (
                    <span style={{ fontSize:10, color: p.category_color || GOLD, fontWeight:600 }}>{p.category_name}</span>
                  )}
                  <span style={{ fontSize:10, color:DIM }}>by {p.author}</span>
                  <span style={{ fontSize:10, color:DIM }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</span>
                  <span style={{ fontSize:10, color:DIM }}>👁 {p.view_count || 0}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <Btn small outline onClick={async () => {
                  const r = await adminApi.get(`/admin/blog/${p.id}`);
                  setModal(r.data.data);
                }}>Edit</Btn>
                <Btn small outline color="#EF4444" onClick={() => deletePost(p.id, p.title)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:20 }}>
          <Btn small outline disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
          <span style={{ color:DIM, fontSize:12, alignSelf:'center' }}>Page {page} / {pagination.total_pages}</span>
          <Btn small outline disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PostModal
          post={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
