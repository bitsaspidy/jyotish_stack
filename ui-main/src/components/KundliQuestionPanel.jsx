'use client';

/**
 * Ask-a-Question panel — deterministic predefined-question flow (Stage 1).
 *
 * The user picks one of the approved catalogue questions (categories +
 * searchable bilingual list) and receives a structured, personalised answer
 * from the deterministic engine. Deliberately NO free-text question input and
 * no generative-model UI of any kind — the panel talks only to
 * GET /kundli/qa/catalogue and POST /kundli/:id/qa/deterministic.
 */

import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';

const GOLD = '#D4AF37';
const IVORY = '#F5F0E8';
const MUTED = 'rgba(245,240,232,0.56)';

// 7 answer states → badge styling
const STATE_STYLE = {
  highly_favourable:     { color:'#34D399', border:'rgba(52,211,153,0.35)',  bg:'rgba(52,211,153,0.1)' },
  favourable:            { color:'#34D399', border:'rgba(52,211,153,0.3)',   bg:'rgba(52,211,153,0.08)' },
  moderately_favourable: { color:'#A3E635', border:'rgba(163,230,53,0.3)',   bg:'rgba(163,230,53,0.08)' },
  mixed:                 { color:'#FBBF24', border:'rgba(251,191,36,0.3)',   bg:'rgba(251,191,36,0.08)' },
  challenging:           { color:'#FB923C', border:'rgba(251,146,60,0.3)',   bg:'rgba(251,146,60,0.08)' },
  highly_challenging:    { color:'#FB7185', border:'rgba(251,113,133,0.3)',  bg:'rgba(251,113,133,0.08)' },
  insufficient_data:     { color:'#93C5FD', border:'rgba(147,197,253,0.3)',  bg:'rgba(147,197,253,0.08)' },
};

const SECTION_ICON = {
  direct_answer:'✦', kundli_indicates:'📜', dchart_indication:'🔭', dasha_influence:'🪐',
  transit_influence:'🌌', positive:'🌱', caution:'⚠️', review_period:'🔄',
  timing_outlook:'⏳', practical_guidance:'✓', remedy:'🕉️', important_note:'ℹ️',
};

function local(hi, en, hindi) { return hi ? (hindi || en) : (en || hindi); }

function StateBadge({ state, label, hi }) {
  const s = STATE_STYLE[state] || STATE_STYLE.mixed;
  return (
    <span style={{ color:s.color, border:`1px solid ${s.border}`, background:s.bg, borderRadius:99, padding:'5px 11px', fontSize:10, fontWeight:800 }}>
      {local(hi, label?.en, label?.hi) || state}
    </span>
  );
}

export default function KundliQuestionPanel({ uuid, name, lang }) {
  const hi = lang === 'hi';
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('idle');        // idle | loading | done | error
  const [answer, setAnswer] = useState(null);
  const [asked, setAsked] = useState(null);          // the question object that was asked
  const [message, setMessage] = useState('');

  // Load the approved question catalogue (DB-backed, pilot questions only).
  useEffect(() => {
    let alive = true;
    api.get('/kundli/qa/catalogue')
      .then(({ data }) => {
        if (alive && data?.categories?.length) {
          setCategories(data.categories);
          setActiveCat(data.categories[0].code);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Search across BOTH languages so Hindi and English queries both work.
  const visibleQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return categories.flatMap((c) => c.questions).filter((item) =>
        (item.question_en || '').toLowerCase().includes(q)
        || (item.question_hi || '').includes(search.trim())
        || (item.short_title_en || '').toLowerCase().includes(q)
        || (item.short_title_hi || '').includes(search.trim()));
    }
    return categories.find((c) => c.code === activeCat)?.questions || [];
  }, [categories, activeCat, search]);

  const ask = async (question) => {
    setState('loading');
    setAsked(question);
    setAnswer(null);
    setMessage('');
    try {
      const { data } = await api.post(`/kundli/${uuid}/qa/deterministic`, { questionCode: question.code, lang });
      setAnswer(data.answer);
      setState('done');
    } catch (error) {
      const msg = error.response?.data?.message
        || (hi ? 'अभी उत्तर तैयार नहीं हो पाया। कृपया कुछ देर बाद पुनः प्रयास करें।' : 'The answer could not be prepared right now. Please try again shortly.');
      setMessage(msg);
      setState('error');
    }
  };

  const askAnother = () => { setAnswer(null); setAsked(null); setMessage(''); setState('idle'); };

  return (
    <section style={{ display:'grid', gap:16 }}>
      {/* header */}
      <div className="card-royal p-5 sm:p-7" style={{ overflow:'hidden', position:'relative' }}>
        <div aria-hidden="true" style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'rgba(59,130,246,0.09)', filter:'blur(45px)', right:-55, top:-75 }} />
        <div style={{ position:'relative', display:'flex', alignItems:'flex-start', gap:13, flexWrap:'wrap' }}>
          <span aria-hidden="true" style={{ width:44, height:44, display:'grid', placeItems:'center', borderRadius:13, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.25)', fontSize:22 }}>✦</span>
          <div style={{ flex:'1 1 260px' }}>
            <p style={{ color:'#93C5FD', fontSize:9, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>
              {hi ? 'आपकी कुंडली से सीधा उत्तर' : 'A direct answer from your Kundli'}
            </p>
            <h2 className="font-serif text-gold text-xl sm:text-2xl font-bold">
              {hi ? 'अपनी कुंडली से प्रश्न पूछें' : 'Ask Your Kundli a Question'}
            </h2>
            <p style={{ color:MUTED, fontSize:12, lineHeight:1.7, marginTop:7 }}>
              {hi
                ? `एक प्रश्न चुनें — ${name || 'आपकी'} जन्म कुंडली, वर्तमान दशा-गोचर और प्रश्न से जुड़ी वर्ग कुंडली को साथ पढ़कर व्यक्तिगत उत्तर तैयार होगा।`
                : `Choose a question — ${name || 'your'} birth chart, the current Dasha & transits and the relevant divisional chart are read together for a personalised answer.`}
            </p>
          </div>
          <span style={{ color:'#34D399', border:'1px solid rgba(52,211,153,0.24)', background:'rgba(52,211,153,0.07)', borderRadius:99, padding:'5px 10px', fontSize:9.5, fontWeight:800 }}>
            {hi ? 'निःशुल्क · निजी' : 'Free · Private'}
          </span>
        </div>
      </div>

      {/* question picker */}
      {state !== 'done' && (
        <div className="card-royal p-5 sm:p-7">
          <label htmlFor="qa-search" style={{ color:IVORY, fontSize:13, fontWeight:800 }}>
            {hi ? 'अपना प्रश्न चुनें' : 'Choose your question'}
          </label>
          <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.65, marginTop:5 }}>
            {hi ? 'श्रेणी चुनें या खोजें — हर उत्तर आपकी अपनी कुंडली से तैयार होता है।' : 'Pick a category or search — every answer is prepared from your own Kundli.'}
          </p>

          <input id="qa-search" type="search" value={search} disabled={state === 'loading'}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={hi ? 'प्रश्न खोजें… (जैसे: विवाह, करियर)' : 'Search questions… (e.g. marriage, career)'}
            className="input-royal w-full mt-3" style={{ minHeight:42 }} />

          {/* category tabs (hidden while searching) */}
          {!search.trim() && categories.length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:14 }}>
              {categories.map((c) => {
                const on = c.code === activeCat;
                return (
                  <button key={c.code} type="button" onClick={() => setActiveCat(c.code)}
                    style={{ color:on ? '#0a0c1c' : 'rgba(245,240,232,0.7)', background:on ? GOLD : 'rgba(255,255,255,0.04)',
                      border:`1px solid ${on ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius:99, padding:'5px 11px', fontSize:9.5, fontWeight:on ? 800 : 500, cursor:'pointer' }}>
                    {local(hi, c.label_en, c.label_hi)}
                  </button>
                );
              })}
            </div>
          )}

          {/* question cards */}
          <div style={{ display:'grid', gap:8, marginTop:12 }}>
            {visibleQuestions.map((q) => (
              <button key={q.code} type="button" disabled={state === 'loading'} onClick={() => ask(q)}
                style={{ display:'flex', alignItems:'center', gap:10, textAlign:'left', color:'rgba(245,240,232,0.85)',
                  border:'1px solid rgba(167,139,250,0.25)', background:'rgba(167,139,250,0.06)', borderRadius:10,
                  padding:'11px 13px', fontSize:11.5, lineHeight:1.6, cursor:state === 'loading' ? 'wait' : 'pointer' }}>
                <span aria-hidden="true" style={{ color:GOLD, fontSize:13 }}>❯</span>
                <span>{local(hi, q.question_en, q.question_hi)}</span>
              </button>
            ))}
            {categories.length > 0 && visibleQuestions.length === 0 && (
              <p style={{ color:MUTED, fontSize:11, padding:'10px 2px' }}>
                {hi ? 'इस खोज से कोई प्रश्न नहीं मिला।' : 'No questions match this search.'}
              </p>
            )}
            {categories.length === 0 && (
              <p style={{ color:MUTED, fontSize:11, padding:'10px 2px' }}>
                {hi ? 'प्रश्न सूची लोड हो रही है…' : 'Loading the question list…'}
              </p>
            )}
          </div>

          {/* loading + error states */}
          {state === 'loading' && (
            <div role="status" style={{ display:'flex', alignItems:'center', gap:10, marginTop:15, padding:'12px 14px', borderRadius:10, border:'1px solid rgba(212,175,55,0.2)', background:'rgba(212,175,55,0.05)' }}>
              <span className="animate-pulse" aria-hidden="true" style={{ fontSize:15 }}>🪔</span>
              <span style={{ color:IVORY, fontSize:11.5 }}>
                {hi ? 'आपकी कुंडली, दशा और गोचर पढ़े जा रहे हैं…' : 'Reading your Kundli, Dasha and transits…'}
              </span>
            </div>
          )}
          {state === 'error' && (
            <div role="alert" style={{ marginTop:15, padding:'11px 13px', borderRadius:9, color:'#FCA5A5', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', fontSize:11.5, lineHeight:1.6 }}>
              {message}
            </div>
          )}

          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, lineHeight:1.55, marginTop:13 }}>
            {hi
              ? 'उत्तर आपकी जन्म कुंडली की सत्यापित गणनाओं और अनुमोदित ज्योतिष नियमों से ही बनते हैं। आपकी कुंडली किसी बाहरी सेवा को नहीं भेजी जाती।'
              : 'Answers are built only from your chart’s verified calculations and approved Jyotish rules. Your Kundli is never sent to any external service.'}
          </p>
        </div>
      )}

      {/* answer view */}
      {state === 'done' && answer && (
        <div style={{ display:'grid', gap:15 }}>
          <article className="card-royal p-5 sm:p-7"
            style={{ border:`1px solid ${(STATE_STYLE[answer.state] || STATE_STYLE.mixed).border}`, background:`linear-gradient(145deg,${(STATE_STYLE[answer.state] || STATE_STYLE.mixed).bg},rgba(17,20,40,0.97))` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <div>
                <p style={{ color:MUTED, fontSize:9.5, marginBottom:5 }}>{hi ? 'आपका प्रश्न' : 'Your question'}</p>
                <p style={{ color:IVORY, fontSize:12.5, lineHeight:1.6 }}>{asked ? local(hi, asked.question_en, asked.question_hi) : ''}</p>
              </div>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                <StateBadge state={answer.state} label={answer.state_label} hi={hi} />
                {answer.confidence && (
                  <span style={{ color:MUTED, border:'1px solid rgba(255,255,255,0.13)', borderRadius:99, padding:'5px 10px', fontSize:9.5, fontWeight:700 }}>
                    {hi ? 'विश्वसनीयता' : 'Confidence'}: {local(hi, answer.confidence.en, answer.confidence.hi)}
                  </span>
                )}
              </div>
            </div>
            {answer.headline && (
              <h3 className="font-serif text-gold text-xl font-bold" style={{ marginTop:16, paddingTop:15, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                {local(hi, answer.headline.en, answer.headline.hi)}
              </h3>
            )}
          </article>

          {(answer.sections || []).map((s) => (
            <section key={s.key} className="card-royal p-5 sm:p-6"
              style={s.key === 'important_note' ? { border:'1px solid rgba(148,163,184,0.16)', background:'rgba(148,163,184,0.04)' } : undefined}>
              <h4 className="font-serif text-gold text-base font-bold" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span aria-hidden="true">{SECTION_ICON[s.key] || '•'}</span>
                {local(hi, s.title_en, s.title_hi)}
              </h4>
              <p style={{ color:s.key === 'important_note' ? MUTED : 'rgba(245,240,232,0.82)', fontSize:s.key === 'direct_answer' ? 13 : 11.8, lineHeight:1.85, marginTop:9, whiteSpace:'pre-line' }}>
                {local(hi, s.text_en, s.text_hi)}
              </p>
            </section>
          ))}

          <button type="button" onClick={askAnother} className="btn-outline-gold" style={{ justifySelf:'start', padding:'9px 17px' }}>
            {hi ? '← दूसरा प्रश्न चुनें' : '← Choose another question'}
          </button>
        </div>
      )}
    </section>
  );
}
