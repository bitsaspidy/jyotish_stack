'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '../../../context/LangContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

export default function BlogPostPage() {
  const { slug }  = useParams();
  const { lang }  = useLang();
  const hi        = lang === 'hi';

  const [post, setPost]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/public/blog/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data?.post) { setNotFound(true); }
        else setPost(d.data.post);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0B0D1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', color:DIM }}>
        <div style={{ fontSize:40, marginBottom:12, animation:'spin 2s linear infinite', display:'inline-block' }}>🪐</div>
        <p>{hi ? 'लोड हो रहा है…' : 'Loading…'}</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#0B0D1A', color:IVORY }}>
      <Navbar />
      <div style={{ maxWidth:720, margin:'0 auto', padding:'120px 24px', textAlign:'center' }}>
        <p style={{ fontSize:60, marginBottom:16 }}>📄</p>
        <h1 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:28, marginBottom:12 }}>
          {hi ? 'लेख नहीं मिला' : 'Article Not Found'}
        </h1>
        <p style={{ color:DIM, marginBottom:24 }}>
          {hi ? 'यह लेख उपलब्ध नहीं है या हटा दिया गया है।' : 'This article is not available or has been removed.'}
        </p>
        <Link href="/blog" style={{ color:GOLD, textDecoration:'none', fontWeight:600, fontSize:14 }}>
          ← {hi ? 'सभी लेख देखें' : 'Back to Blog'}
        </Link>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0B0D1A', color:IVORY }}>
      <Navbar />

      <article style={{ maxWidth:780, margin:'0 auto', padding:'96px 24px 60px' }}>

        {/* Back link */}
        <Link href="/blog" style={{ color:DIM, textDecoration:'none', fontSize:13,
          display:'inline-flex', alignItems:'center', gap:6, marginBottom:28 }}>
          ← {hi ? 'ब्लॉग पर वापस' : 'Back to Blog'}
        </Link>

        {/* Meta */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:16 }}>
          {post.category_name && (
            <span style={{ fontSize:11, padding:'3px 11px', borderRadius:20,
              background:`${post.category_color || GOLD}18`, color:post.category_color || GOLD,
              border:`1px solid ${post.category_color || GOLD}35`, fontWeight:600 }}>
              {post.category_name}
            </span>
          )}
          {post.published_at && (
            <span style={{ color:DIM, fontSize:12 }}>
              {new Date(post.published_at).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { dateStyle:'long' })}
            </span>
          )}
          {post.author && <span style={{ color:DIM, fontSize:12 }}>· {post.author}</span>}
          {post.view_count > 0 && (
            <span style={{ color:DIM, fontSize:12 }}>· 👁 {post.view_count}</span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:30, fontWeight:700, lineHeight:1.4,
          marginBottom:20, background:`linear-gradient(135deg, ${GOLD}, #F0D060)`,
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ color:DIM, fontSize:16, lineHeight:1.8, fontStyle:'italic',
            borderLeft:`3px solid ${GOLD}40`, paddingLeft:16, marginBottom:28 }}>
            {post.excerpt}
          </p>
        )}

        {/* Cover image */}
        {post.cover_image && (
          <img src={post.cover_image} alt={post.title}
            style={{ width:'100%', maxHeight:420, objectFit:'cover', borderRadius:10, marginBottom:32 }} />
        )}

        {/* Content */}
        {post.content ? (
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{ color:IVORY, fontSize:15, lineHeight:1.9, fontFamily:'Georgia,serif' }}
            className="blog-content"
          />
        ) : (
          <p style={{ color:DIM, fontStyle:'italic' }}>
            {hi ? 'इस लेख की सामग्री उपलब्ध नहीं है।' : 'Content not available.'}
          </p>
        )}

        {/* Tags */}
        {post.tags && (
          <div style={{ marginTop:36, paddingTop:20, borderTop:'1px solid rgba(212,175,55,0.12)' }}>
            <p style={{ color:DIM, fontSize:11, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:10 }}>
              {hi ? 'टैग' : 'Tags'}
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} style={{ fontSize:11, padding:'4px 12px', borderRadius:20,
                  background:'rgba(212,175,55,0.08)', color:GOLD,
                  border:'1px solid rgba(212,175,55,0.2)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div style={{ marginTop:48, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/blog" style={{ color:GOLD, textDecoration:'none', fontWeight:600, fontSize:14 }}>
            ← {hi ? 'सभी लेख देखें' : 'All Articles'}
          </Link>
        </div>
      </article>

      {/* Inline blog-content styles */}
      <style>{`
        .blog-content h1,.blog-content h2,.blog-content h3 { color:${GOLD}; font-family:Georgia,serif; margin:28px 0 12px; }
        .blog-content h1 { font-size:24px; }
        .blog-content h2 { font-size:20px; }
        .blog-content h3 { font-size:17px; }
        .blog-content p  { margin-bottom:18px; }
        .blog-content ul,.blog-content ol { padding-left:24px; margin-bottom:18px; }
        .blog-content li { margin-bottom:8px; color:${DIM}; }
        .blog-content a  { color:${GOLD}; }
        .blog-content blockquote { border-left:3px solid ${GOLD}50; padding-left:16px; color:${DIM}; font-style:italic; margin:20px 0; }
        .blog-content strong { color:${IVORY}; }
        .blog-content img { max-width:100%; border-radius:8px; margin:16px 0; }
        .blog-content code { background:rgba(212,175,55,0.1); color:${GOLD}; padding:2px 6px; border-radius:4px; font-size:13px; }
        .blog-content pre code { display:block; padding:14px; overflow-x:auto; }
      `}</style>
      <Footer />
    </div>
  );
}
