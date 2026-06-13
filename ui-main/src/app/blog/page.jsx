'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLang } from '../../context/LangContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

const fetchPublic = (path) =>
  fetch(`/api/public${path}`).then(r => r.json()).then(d => d.data || d);

export default function BlogPage() {
  const { lang } = useLang();
  const hi = lang === 'hi';

  const [posts, setPosts]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]           = useState(1);
  const [category, setCategory]   = useState('');
  const [search, setSearch]       = useState('');
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 9 });
    if (category) params.set('category', category);
    if (query)    params.set('search', query);
    const r = await fetchPublic(`/blog?${params}`);
    setPosts(r.posts || []);
    setPagination(r.pagination || null);
    setLoading(false);
  }, [page, category, query]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchPublic('/blog-categories').then(d => setCategories(d.categories || []));
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0B0D1A', color:IVORY }}>
      <Navbar />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'100px 24px 60px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:36, fontWeight:700,
            background:`linear-gradient(135deg, ${GOLD}, #F0D060)`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:12 }}>
            {hi ? 'ज्योतिष लेख' : 'Astrology Blog'}
          </h1>
          <p style={{ color:DIM, fontSize:15 }}>
            {hi ? 'वैदिक ज्योतिष की गहन जानकारी हिंदी और अंग्रेजी में' : 'Vedic astrology insights, guides and research'}
          </p>
          <div style={{ width:60, height:2, background:GOLD, margin:'16px auto 0', borderRadius:2 }} />
        </div>

        {/* Search + filters */}
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28, alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setQuery(search); setPage(1); } }}
              placeholder={hi ? 'लेख खोजें…' : 'Search articles…'}
              style={{ width:'100%', background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(212,175,55,0.2)', borderRadius:8,
                color:IVORY, fontSize:13, padding:'10px 14px', boxSizing:'border-box' }}
            />
          </div>
          <button onClick={() => { setQuery(search); setPage(1); }} style={{
            background:`${GOLD}18`, border:`1px solid ${GOLD}40`, color:GOLD,
            borderRadius:8, fontSize:13, fontWeight:600, padding:'10px 18px', cursor:'pointer',
          }}>
            {hi ? 'खोजें' : 'Search'}
          </button>
          {query && (
            <button onClick={() => { setSearch(''); setQuery(''); setPage(1); }} style={{
              background:'transparent', border:'1px solid rgba(255,255,255,0.12)',
              color:DIM, borderRadius:8, fontSize:12, padding:'10px 14px', cursor:'pointer',
            }}>
              ✕ {hi ? 'साफ़ करें' : 'Clear'}
            </button>
          )}
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:32 }}>
            {[{ slug:'', name: hi ? 'सभी' : 'All' }, ...categories].map(c => (
              <button key={c.slug} onClick={() => { setCategory(c.slug); setPage(1); }}
                style={{ fontSize:12, padding:'6px 16px', borderRadius:20, cursor:'pointer',
                  background: category === c.slug ? `${c.color || GOLD}20` : 'transparent',
                  color: category === c.slug ? (c.color || GOLD) : DIM,
                  border: `1px solid ${category === c.slug ? (c.color || GOLD) + '50' : 'rgba(255,255,255,0.08)'}`,
                  fontWeight: category === c.slug ? 600 : 400,
                }}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:DIM }}>
            <div style={{ fontSize:40, marginBottom:16, animation:'spin 2s linear infinite', display:'inline-block' }}>🪐</div>
            <p>{hi ? 'लोड हो रहा है…' : 'Loading…'}</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:DIM }}>
            <p style={{ fontSize:48, marginBottom:16 }}>📝</p>
            <p style={{ fontSize:16 }}>{hi ? 'अभी कोई लेख नहीं मिला।' : 'No articles found.'}</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
            {posts.map(p => (
              <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration:'none' }}>
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.1)',
                  borderRadius:12, overflow:'hidden', height:'100%',
                  transition:'border-color 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.1)'; e.currentTarget.style.transform = 'none'; }}>
                  {p.cover_image && (
                    <img src={p.cover_image} alt={p.title}
                      style={{ width:'100%', height:180, objectFit:'cover' }} />
                  )}
                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                      {p.category_name && (
                        <span style={{ fontSize:10, padding:'2px 9px', borderRadius:10,
                          background:`${p.category_color || GOLD}18`, color:p.category_color || GOLD,
                          border:`1px solid ${p.category_color || GOLD}30`, fontWeight:600 }}>
                          {p.category_name}
                        </span>
                      )}
                      <span style={{ fontSize:10, color:DIM }}>
                        {p.published_at ? new Date(p.published_at).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { dateStyle:'medium' }) : ''}
                      </span>
                    </div>
                    <h3 style={{ color:IVORY, fontFamily:'Georgia,serif', fontSize:15, fontWeight:700,
                      lineHeight:1.5, marginBottom:8 }}>
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p style={{ color:DIM, fontSize:12, lineHeight:1.7,
                        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:3,
                        WebkitBoxOrient:'vertical' }}>
                        {p.excerpt}
                      </p>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14 }}>
                      <span style={{ color:DIM, fontSize:11 }}>
                        {hi ? 'लेखक:' : 'By'} {p.author || 'Jyotish Stack'}
                      </span>
                      <span style={{ color:GOLD, fontSize:11, fontWeight:600 }}>
                        {hi ? 'पढ़ें →' : 'Read →'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:40 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{
              background:'transparent', border:`1px solid ${GOLD}40`, color:GOLD,
              borderRadius:8, fontSize:13, padding:'9px 18px', cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
            }}>← {hi ? 'पिछला' : 'Prev'}</button>
            <span style={{ color:DIM, fontSize:13, alignSelf:'center', padding:'0 12px' }}>
              {page} / {pagination.total_pages}
            </span>
            <button disabled={page >= pagination.total_pages} onClick={() => setPage(p => p + 1)} style={{
              background:'transparent', border:`1px solid ${GOLD}40`, color:GOLD,
              borderRadius:8, fontSize:13, padding:'9px 18px',
              cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer',
              opacity: page >= pagination.total_pages ? 0.4 : 1,
            }}>{hi ? 'अगला' : 'Next'} →</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
