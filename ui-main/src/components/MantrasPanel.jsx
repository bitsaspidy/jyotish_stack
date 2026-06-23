'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';

const GOLD   = '#D4AF37';
const AMBER  = '#F59E0B';
const MUTED  = 'rgba(245,240,232,0.55)';
const IVORY  = '#EFE9D8';

function MantraCard({ mantra, lang }) {
  const [open, setOpen] = useState(false);
  const hi = lang === 'hi';

  const name    = hi ? mantra.name_hi    : mantra.name_en;
  const desc    = hi ? mantra.description_hi : mantra.description_en;
  const mainText= hi ? mantra.mantra_text_hindi   : mantra.mantra_text_sanskrit;
  const translit= mantra.mantra_text_english;
  const meaning = hi ? mantra.meaning_hi : mantra.meaning_en;
  const benefits= hi ? mantra.benefits_hi : mantra.benefits_en;

  return (
    <div style={{ border:'1px solid rgba(212,175,55,0.25)', borderRadius:12, overflow:'hidden', marginBottom:12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width:'100%', textAlign:'left', padding:'14px 18px', background:'rgba(212,175,55,0.06)',
          display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', border:'none' }}
      >
        <span style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>🕉</span>
          <span style={{ fontWeight:700, fontSize:13, color:GOLD, fontFamily:'var(--font-devanagari),sans-serif' }}>
            {name}
          </span>
          {mantra.jap_count && (
            <span style={{ fontSize:10, color:'rgba(212,175,55,0.5)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:20, padding:'1px 8px' }}>
              × {mantra.jap_count} {hi ? 'बार' : 'times'}
            </span>
          )}
        </span>
        <span style={{ fontSize:11, color:'rgba(245,240,232,0.35)', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding:'16px 18px 18px', background:'rgba(14,18,38,0.6)' }}>
          {desc && (
            <p style={{ fontSize:12, color:MUTED, marginBottom:16, lineHeight:1.6, fontFamily:'var(--font-devanagari),sans-serif' }}>
              {desc}
            </p>
          )}

          {/* Mantra text */}
          <div style={{ background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:8, padding:'14px 16px', marginBottom:14, textAlign:'center' }}>
            <p style={{ fontSize:10, color:AMBER, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
              {hi ? 'मंत्र' : 'Mantra'}
            </p>
            <p style={{ fontSize:15, color:IVORY, fontWeight:600, lineHeight:1.8, fontFamily:'var(--font-devanagari),sans-serif', marginBottom: translit ? 8 : 0 }}>
              {mainText}
            </p>
            {translit && (
              <p style={{ fontSize:11, color:MUTED, fontStyle:'italic' }}>{translit}</p>
            )}
          </div>

          {/* Meaning */}
          {meaning && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:10, color:AMBER, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                {hi ? 'मंत्र का अर्थ' : 'Meaning'}
              </p>
              <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>
                {meaning}
              </p>
            </div>
          )}

          {/* Benefits */}
          {benefits && (
            <div>
              <p style={{ fontSize:10, color:AMBER, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                {hi ? 'जाप के लाभ' : 'Benefits'}
              </p>
              <p style={{ fontSize:12, color:MUTED, lineHeight:1.7, fontFamily:'var(--font-devanagari),sans-serif' }}>
                {benefits}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MantrasPanel({ lang = 'en', category = 'opening' }) {
  const [mantras, setMantras] = useState([]);
  const hi = lang === 'hi';

  useEffect(() => {
    api.get(`/public/mantras?category=${category}`)
      .then(({ data }) => setMantras(data.mantras || []))
      .catch(() => {});
  }, [category]);

  if (!mantras.length) return null;

  return (
    <div style={{ marginTop:24, marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>🕉</span>
        <h3 style={{ fontWeight:700, fontSize:13, color:GOLD, fontFamily:'var(--font-devanagari),sans-serif', margin:0 }}>
          {hi ? 'पूजा आरंभ मंत्र' : 'Opening Invocation Mantras'}
        </h3>
      </div>
      {mantras.map(m => <MantraCard key={m.id} mantra={m} lang={lang} />)}
    </div>
  );
}
