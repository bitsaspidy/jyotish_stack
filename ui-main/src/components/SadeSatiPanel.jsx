'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Lifetime Sade Sati journey — all Saturn-over-Moon cycles with phase dates.
// Data: profile.sade_sati_journey (computed server-side in cosmic-insights.js)

const PH_STYLE = {
  rising:  { color:'#F59E0B', icon:'🌅' },
  peak:    { color:'#EF4444', icon:'🌞' },
  setting: { color:'#60A5FA', icon:'🌇' },
};

export default function SadeSatiPanel({ journey, lang = 'en' }) {
  const [showAll, setShowAll] = useState(false);
  if (!journey?.phases?.length) return null;
  const T = (en, hi) => (lang === 'hi' ? hi : en);

  // Recompute is_current / is_past from today's real date — stored flags freeze at calculation time.
  const todayMs = Date.now();
  const livePhases = journey.phases.map((p) => ({
    ...p,
    is_current: new Date(p.start).getTime() <= todayMs && todayMs <= new Date(p.end).getTime(),
    is_past:    new Date(p.end).getTime() < todayMs,
  }));
  const now    = livePhases.find((p) => p.is_current) || null;
  const active = !!now;
  const phases = showAll ? livePhases : livePhases.filter((p) => !p.is_past || p.is_current);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
      className="card-royal p-5 mt-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-serif text-gold text-sm font-semibold">
          🪐 {T('Your Sade Sati Journey', 'आपकी साढ़ेसाती यात्रा')}
        </h2>
        <span style={{
          fontSize:10, fontWeight:700, borderRadius:10, padding:'3px 10px',
          color: active ? '#EF4444' : '#22C55E',
          background: active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${active ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        }}>
          {active ? T('ACTIVE NOW', 'अभी सक्रिय') : T('Not active currently', 'वर्तमान में सक्रिय नहीं')}
        </span>
      </div>
      <p className="text-ivory/45 text-[11px] mb-4 font-devanagari">
        {T(`Saturn's 7.5-year transit around your natal Moon (${journey.moon_rashi_en}) — comes roughly every 30 years in three phases: Rising (12th from Moon), Peak (over Moon) and Setting (2nd from Moon).`,
           `शनि का आपके जन्म चंद्र (${journey.moon_rashi_hi}) के चारों ओर 7.5 वर्ष का गोचर — लगभग हर 30 वर्ष में तीन चरणों में आता है: उदय (चंद्र से 12वां), चरम (चंद्र पर) और अस्त (चंद्र से दूसरा)।`)}
      </p>

      {now && (
        <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:10, padding:'10px 13px', marginBottom:14 }}>
          <p style={{ color:'#EF4444', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>
            {PH_STYLE[now.phase]?.icon} {T('Currently Running', 'अभी चल रहा है')}: {lang === 'hi' ? now.phase_hi : now.phase_en} ({now.start} → {now.end})
          </p>
          <p className="text-ivory/75 text-[11px] leading-relaxed font-devanagari">{lang === 'hi' ? now.text_hi : now.text_en}</p>
        </div>
      )}

      {/* Phase timeline table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:'rgba(212,175,55,0.08)' }}>
              {[T('Cycle','चक्र'), T('Phase','चरण'), T('From','से'), T('To','तक'), T('Status','स्थिति')].map((h) => (
                <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#D4AF37', fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map((p, i) => {
              const st = PH_STYLE[p.phase] || {};
              return (
                <tr key={i} style={{
                  borderTop:'1px solid rgba(255,255,255,0.05)',
                  background: p.is_current ? 'rgba(212,175,55,0.1)' : i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}>
                  <td style={{ padding:'6px 10px', color:'rgba(245,240,232,0.6)' }}>{p.cycle}</td>
                  <td style={{ padding:'6px 10px', color:st.color, fontWeight:700 }} className="font-devanagari">
                    {st.icon} {lang === 'hi' ? p.phase_hi : p.phase_en}
                  </td>
                  <td style={{ padding:'6px 10px', color:'rgba(245,240,232,0.78)' }}>{p.start}</td>
                  <td style={{ padding:'6px 10px', color:'rgba(245,240,232,0.78)' }}>{p.end}</td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{
                      fontSize:9, fontWeight:700, borderRadius:8, padding:'2px 8px',
                      color: p.is_current ? '#22C55E' : p.is_past ? 'rgba(245,240,232,0.35)' : '#60A5FA',
                      background: p.is_current ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                    }}>
                      {p.is_current ? T('RUNNING NOW','अभी चल रहा') : p.is_past ? T('Completed','पूर्ण') : T('Upcoming','आगामी')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {livePhases.some((p) => p.is_past && !p.is_current) && (
        <button onClick={() => setShowAll(!showAll)}
          style={{ marginTop:10, background:'transparent', border:'none', color:'#A78BFA', fontSize:11, fontWeight:700, cursor:'pointer', padding:0 }}>
          {showAll ? T('▲ Hide past cycles', '▲ पिछले चक्र छिपाएं') : T('▼ Show full lifetime map (incl. past)', '▼ पूरा जीवन मानचित्र देखें (पिछले सहित)')}
        </button>
      )}

      {/* Phase meanings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
        {['rising','peak','setting'].map((ph) => {
          const info = livePhases.find((p) => p.phase === ph);
          if (!info) return null;
          const st = PH_STYLE[ph];
          return (
            <div key={ph} style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${st.color}33`, borderRadius:8, padding:'9px 11px' }}>
              <p style={{ color:st.color, fontSize:10, fontWeight:700, marginBottom:4 }} className="font-devanagari">
                {st.icon} {lang === 'hi' ? info.phase_hi : info.phase_en}
              </p>
              <p className="text-ivory/60 text-[10px] leading-relaxed font-devanagari">{lang === 'hi' ? info.text_hi : info.text_en}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
