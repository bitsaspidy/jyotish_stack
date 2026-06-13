'use client';
import { useState } from 'react';
import api from '../lib/api';

const GOLD = '#D4AF37'; const IVORY = '#F5F0E8'; const DIM = 'rgba(245,240,232,0.45)';

export default function AIPredictionPanel({ uuid, lang }) {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [reading, setReading] = useState(null);
  const [msg, setMsg] = useState('');

  const generate = async () => {
    setState('loading');
    setReading(null);
    try {
      const { data } = await api.post(`/kundli/${uuid}/ai-reading`);
      if (data.data?.stub || !data.data?.available) {
        setMsg(data.data?.message || 'AI readings coming soon.');
        setState('stub');
      } else {
        setReading(data.data.reading);
        setState('done');
      }
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to generate reading.');
      setState('error');
    }
  };

  const hi = lang === 'hi';

  return (
    <div style={{ background:'rgba(212,175,55,0.03)', border:'1px solid rgba(212,175,55,0.15)',
      borderRadius:12, padding:'24px 28px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
        <span style={{ fontSize:28 }}>🤖</span>
        <div>
          <h3 style={{ color:GOLD, fontFamily:'Georgia,serif', fontSize:17, fontWeight:700, marginBottom:2 }}>
            {hi ? 'AI व्यक्तिगत भविष्यवाणी' : 'AI Personalised Reading'}
          </h3>
          <p style={{ color:DIM, fontSize:12 }}>
            {hi
              ? 'Claude AI द्वारा आपकी कुंडली का गहन विश्लेषण'
              : 'Deep chart analysis powered by Claude AI'}
          </p>
        </div>
        <span style={{ marginLeft:'auto', fontSize:10, padding:'3px 10px', borderRadius:20,
          background:'rgba(139,92,246,0.12)', color:'#A78BFA',
          border:'1px solid rgba(139,92,246,0.25)', fontWeight:600 }}>
          {hi ? 'बीटा' : 'BETA'}
        </span>
      </div>

      {state === 'idle' && (
        <div>
          <p style={{ color:DIM, fontSize:13, lineHeight:1.75, marginBottom:20 }}>
            {hi
              ? 'Claude AI आपकी ग्रह स्थिति, दशा और योगों का विश्लेषण करके एक व्यक्तिगत ज्योतिष पठन तैयार करेगा।'
              : 'Claude AI will analyse your planet placements, Dasha period, and Yogas to write a personal Vedic reading tailored specifically to your chart.'}
          </p>
          <button onClick={generate} style={{
            background:`linear-gradient(135deg, #5B21B6, #7C3AED)`,
            color:'#fff', border:'none', borderRadius:8,
            fontWeight:700, fontSize:13, padding:'11px 24px',
            cursor:'pointer', display:'flex', alignItems:'center', gap:8,
          }}>
            <span>✨</span>
            {hi ? 'AI पठन उत्पन्न करें' : 'Generate AI Reading'}
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div style={{ textAlign:'center', padding:'32px 0' }}>
          <div style={{ fontSize:36, marginBottom:12, animation:'spin 2s linear infinite', display:'inline-block' }}>🪐</div>
          <p style={{ color:GOLD, fontSize:13, fontWeight:600 }}>
            {hi ? 'Claude AI आपकी कुंडली पढ़ रहा है…' : 'Claude AI is reading your chart…'}
          </p>
          <p style={{ color:DIM, fontSize:11, marginTop:6 }}>
            {hi ? 'यह 10–20 सेकंड ले सकता है' : 'This may take 10–20 seconds'}
          </p>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {(state === 'stub' || state === 'error') && (
        <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)',
          borderRadius:8, padding:'16px 20px', display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>🔮</span>
          <div>
            <p style={{ color:'#FBBF24', fontWeight:600, fontSize:13, marginBottom:6 }}>
              {state === 'stub'
                ? (hi ? 'जल्द आ रहा है' : 'Coming Soon')
                : (hi ? 'त्रुटि' : 'Error')}
            </p>
            <p style={{ color:DIM, fontSize:13, lineHeight:1.65 }}>{msg}</p>
            {state === 'error' && (
              <button onClick={() => setState('idle')} style={{
                marginTop:12, background:'transparent', border:`1px solid ${GOLD}40`,
                color:GOLD, borderRadius:6, fontSize:12, padding:'5px 14px', cursor:'pointer',
              }}>
                {hi ? 'पुनः प्रयास करें' : 'Try again'}
              </button>
            )}
          </div>
        </div>
      )}

      {state === 'done' && reading && (
        <div>
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(212,175,55,0.12)',
            borderRadius:8, padding:'20px 24px', marginBottom:16 }}>
            {/* Render markdown-like formatting */}
            {reading.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={i} style={{ color:GOLD, fontFamily:'Georgia,serif', fontWeight:700,
                    fontSize:14, marginTop: i > 0 ? 18 : 0, marginBottom:8 }}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (line.trim() === '') return <div key={i} style={{ height:6 }} />;
              return (
                <p key={i} style={{ color: IVORY, fontSize:13, lineHeight:1.8,
                  marginBottom:4, fontFamily:'Georgia,serif' }}>
                  {line}
                </p>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'space-between', alignItems:'center', flexWrap:'wrap' }}>
            <p style={{ color:DIM, fontSize:11 }}>
              {hi
                ? '🤖 Claude Sonnet द्वारा उत्पन्न · केवल मनोरंजन और आध्यात्मिक मार्गदर्शन के लिए'
                : '🤖 Generated by Claude Sonnet · For entertainment and spiritual guidance only'}
            </p>
            <button onClick={() => setState('idle')} style={{
              background:'transparent', border:`1px solid ${GOLD}35`,
              color:GOLD, borderRadius:6, fontSize:11, padding:'5px 14px', cursor:'pointer',
            }}>
              {hi ? 'नया पठन' : 'New reading'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
