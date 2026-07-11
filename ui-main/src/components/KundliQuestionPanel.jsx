'use client';

import { useState, useRef } from 'react';
import api from '../lib/api';

const GOLD = '#D4AF37';
const IVORY = '#F5F0E8';
const MUTED = 'rgba(245,240,232,0.56)';

const EXAMPLES = [
  { en:'Should I accept this job offer?', hi:'क्या मुझे यह नौकरी का प्रस्ताव स्वीकार करना चाहिए?' },
  { en:'When is a supportive period for marriage?', hi:'विवाह के लिए सहायक समय कब है?' },
  { en:'Is this a good period to buy a home?', hi:'क्या यह घर खरीदने का अच्छा समय है?' },
  { en:'How should I prepare for my examination?', hi:'मुझे अपनी परीक्षा की तैयारी कैसे करनी चाहिए?' },
];

const TONE_STYLE = {
  supportive:{ color:'#34D399', border:'rgba(52,211,153,0.3)', bg:'rgba(52,211,153,0.08)' },
  balanced:{ color:'#FBBF24', border:'rgba(251,191,36,0.3)', bg:'rgba(251,191,36,0.08)' },
  caution:{ color:'#FB7185', border:'rgba(251,113,133,0.3)', bg:'rgba(251,113,133,0.08)' },
  favorable:{ color:'#34D399', border:'rgba(52,211,153,0.3)', bg:'rgba(52,211,153,0.08)' },
  moderate:{ color:'#FBBF24', border:'rgba(251,191,36,0.3)', bg:'rgba(251,191,36,0.08)' },
  challenging:{ color:'#FB7185', border:'rgba(251,113,133,0.3)', bg:'rgba(251,113,133,0.08)' },
  neutral:{ color:'#93C5FD', border:'rgba(147,197,253,0.3)', bg:'rgba(147,197,253,0.08)' },
};

function local(hi, en, hindi) { return hi ? (hindi || en) : (en || hindi); }

// Circular progress ring + live elapsed seconds shown while the AI is thinking.
// Fills toward a typical duration; once it passes that it eases to a near-full
// gentle wait state instead of implying it's stuck.
function CircleTimer({ seconds, estimate = 32 }) {
  const R = 26, SW = 4, C = 2 * Math.PI * R;
  const frac = 1 - Math.exp(-seconds / estimate);     // asymptotic → never quite 100%
  const dash = Math.min(frac, 0.985) * C;
  return (
    <svg width="66" height="66" viewBox="0 0 66 66" style={{ flexShrink:0 }}>
      <circle cx="33" cy="33" r={R} fill="none" stroke="rgba(196,181,253,0.18)" strokeWidth={SW} />
      <circle cx="33" cy="33" r={R} fill="none" stroke="#C4B5FD" strokeWidth={SW} strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`} transform="rotate(-90 33 33)"
        style={{ transition:'stroke-dasharray 0.15s linear' }} />
      <text x="33" y="35" textAnchor="middle" dominantBaseline="middle" fill="#C4B5FD" fontSize="15" fontWeight="700">
        {seconds.toFixed(1)}s
      </text>
    </svg>
  );
}

function dateLabel(value, hi) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { day:'numeric', month:'short', year:'numeric' }).format(date);
}

function ToneBadge({ tone, hi }) {
  const style = TONE_STYLE[tone] || TONE_STYLE.neutral;
  const labels = {
    supportive:['Supportive','सहायक'], balanced:['Conditional','शर्तों के साथ'], caution:['Use caution','सावधानी'],
    favorable:['Supportive','सहायक'], moderate:['Balanced','मध्यम'], challenging:['Needs care','ध्यान जरूरी'], neutral:['Mixed','मिश्रित'],
  };
  const pair = labels[tone] || labels.neutral;
  return <span style={{ color:style.color, border:`1px solid ${style.border}`, background:style.bg, borderRadius:99, padding:'4px 9px', fontSize:9.5, fontWeight:800 }}>{hi ? pair[1] : pair[0]}</span>;
}

export default function KundliQuestionPanel({ uuid, name, lang }) {
  const hi = lang === 'hi';
  const [question, setQuestion] = useState('');
  const [state, setState] = useState('idle');
  const [answer, setAnswer] = useState(null);
  const [message, setMessage] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiState, setAiState] = useState('idle');   // idle | streaming | done
  const [elapsed, setElapsed] = useState(0);        // seconds since AI request began
  const aiAbort = useRef(null);
  const aiTimer = useRef(null);

  const stopTimer = () => { if (aiTimer.current) { clearInterval(aiTimer.current); aiTimer.current = null; } };

  // Stream the AI "Final Answer" token-by-token from the server (typing effect).
  const startAiStream = async (q) => {
    aiAbort.current?.abort();
    const controller = new AbortController();
    aiAbort.current = controller;
    setAiText('');
    setAiState('streaming');
    // live elapsed timer during the "thinking" (pre-first-token) wait
    setElapsed(0);
    stopTimer();
    const startedAt = Date.now();
    aiTimer.current = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`/api/kundli/${uuid}/ask-question/ai-stream`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        credentials:'include',
        body:JSON.stringify({ question:q, category:'general', lang }),
        signal:controller.signal,
      });
      if (!res.ok || !res.body || res.status === 204) { stopTimer(); setAiState('idle'); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let got = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream:true });
        if (chunk) {
          if (!got) stopTimer();   // first token arrived — stop the thinking timer
          got = true;
          setAiText((prev) => prev + chunk);
        }
      }
      stopTimer();
      setAiState(got ? 'done' : 'idle');
    } catch (e) {
      stopTimer();
      if (e.name !== 'AbortError') setAiState(() => (aiText ? 'done' : 'idle'));
    }
  };

  const submit = async (event) => {
    event?.preventDefault();
    const clean = question.replace(/\s+/g, ' ').trim();
    if (clean.length < 8) {
      setMessage(hi ? 'कृपया कम से कम 8 अक्षरों में एक स्पष्ट प्रश्न लिखें।' : 'Please write one clear question using at least 8 characters.');
      setState('error');
      return;
    }
    setState('loading');
    setMessage('');
    setAnswer(null);
    setAiText('');
    setAiState('idle');
    try {
      const { data } = await api.post(`/kundli/${uuid}/ask-question`, { question:clean, category:'general', lang });
      setAnswer(data.answer);
      setState('done');
      startAiStream(clean);   // begin live AI answer once the structured answer is shown
    } catch (error) {
      setMessage(error.response?.data?.message || (hi ? 'अभी उत्तर नहीं बन पाया। कृपया फिर प्रयास करें।' : 'The answer could not be prepared right now. Please try again.'));
      setState('error');
    }
  };

  const askAnother = () => {
    aiAbort.current?.abort();
    stopTimer();
    setQuestion('');
    setAnswer(null);
    setMessage('');
    setState('idle');
    setAiText('');
    setAiState('idle');
    setElapsed(0);
  };

  return (
    <section style={{ display:'grid', gap:16 }}>
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
                ? `${name || 'आपकी'} जन्म कुंडली, वर्तमान समय और प्रश्न के अनुसार सही वर्ग कुंडली—जैसे करियर के लिए D10 या विवाह के लिए D9—को साथ पढ़ा जाएगा।`
                : `${name || 'Your'} birth chart, current timing and the right divisional chart—such as D10 for career or D9 for marriage—will be read together.`}
            </p>
          </div>
          <span style={{ color:'#34D399', border:'1px solid rgba(52,211,153,0.24)', background:'rgba(52,211,153,0.07)', borderRadius:99, padding:'5px 10px', fontSize:9.5, fontWeight:800 }}>
            {hi ? 'निःशुल्क · निजी' : 'Free · Private'}
          </span>
        </div>
      </div>

      {state !== 'done' && (
        <form onSubmit={submit} className="card-royal p-5 sm:p-7">
          <label htmlFor="kundli-question" style={{ color:IVORY, fontSize:13, fontWeight:800 }}>
            {hi ? 'आप क्या समझना चाहते हैं?' : 'What would you like to understand?'}
          </label>
          <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.65, marginTop:5 }}>
            {hi ? 'एक समय में एक ही विषय पूछें। निर्णय, समय या अगले कदम को स्पष्ट लिखें।' : 'Ask about one topic at a time. Clearly state the decision, timing or next step you need help with.'}
          </p>
          <textarea id="kundli-question" value={question} maxLength={500} rows={4} disabled={state === 'loading'}
            onChange={(event) => { setQuestion(event.target.value); if (state === 'error') setState('idle'); }}
            placeholder={hi ? 'उदाहरण: क्या मुझे इस वर्ष नौकरी बदलनी चाहिए?' : 'Example: Should I change my job this year?'}
            className="input-royal w-full mt-3" style={{ resize:'vertical', minHeight:105, lineHeight:1.7 }} />
          <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginTop:5 }}>
            <span style={{ color:MUTED, fontSize:9.5 }}>{hi ? 'नाम, विकल्प या समय-सीमा जोड़ने से उत्तर बेहतर होता है।' : 'Adding the option or time frame makes the answer clearer.'}</span>
            <span style={{ color:question.length > 470 ? '#FB7185' : MUTED, fontSize:9.5, flexShrink:0 }}>{question.length}/500</span>
          </div>

          <div style={{ marginTop:16 }}>
            <p style={{ color:'#93C5FD', fontSize:9.5, fontWeight:800, marginBottom:8 }}>{hi ? 'उदाहरण प्रश्न' : 'Try an example'}</p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {EXAMPLES.map((example) => (
                <button key={example.en} type="button" disabled={state === 'loading'} onClick={() => setQuestion(local(hi, example.en, example.hi))}
                  style={{ color:'rgba(245,240,232,0.72)', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.035)', borderRadius:8, padding:'7px 10px', fontSize:9.5, cursor:'pointer', textAlign:'left' }}>
                  {local(hi, example.en, example.hi)}
                </button>
              ))}
            </div>
          </div>

          {state === 'error' && (
            <div role="alert" style={{ marginTop:15, padding:'11px 13px', borderRadius:9, color:'#FCA5A5', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', fontSize:11.5, lineHeight:1.6 }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={state === 'loading' || question.trim().length < 8} className="btn-gold mt-5"
            style={{ minHeight:42, padding:'10px 20px', opacity:state === 'loading' || question.trim().length < 8 ? 0.55 : 1, cursor:state === 'loading' ? 'wait' : 'pointer' }}>
            {state === 'loading' ? (hi ? 'कुंडली और संबंधित वर्ग देखे जा रहे हैं…' : 'Reading the relevant charts…') : (hi ? 'मेरी कुंडली से उत्तर देखें' : 'Read the Answer from My Kundli')}
          </button>

          <p style={{ color:'rgba(245,240,232,0.35)', fontSize:9, lineHeight:1.55, marginTop:13 }}>
            {hi ? 'आपकी जन्म-कुंडली बाहरी AI को नहीं भेजी जाती। प्रश्न की दिशा स्थानीय Python सेवा समझती है और सुरक्षित सर्वर केवल आवश्यक चार्ट पढ़ता है।' : 'Your birth chart is not sent to an external AI. A local Python service understands the question, and the secure server reads only the required charts.'}
          </p>
        </form>
      )}

      {state === 'done' && answer && (
        <div style={{ display:'grid', gap:15 }}>
          <article className="card-royal p-5 sm:p-7" style={{ border:`1px solid ${(TONE_STYLE[answer.answer.tone] || TONE_STYLE.neutral).border}`, background:`linear-gradient(145deg,${(TONE_STYLE[answer.answer.tone] || TONE_STYLE.neutral).bg},rgba(17,20,40,0.97))` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <div>
                <p style={{ color:MUTED, fontSize:9.5, marginBottom:5 }}>{hi ? 'आपका प्रश्न' : 'Your question'}</p>
                <p style={{ color:IVORY, fontSize:12.5, lineHeight:1.6 }}>{answer.question.text}</p>
              </div>
              <ToneBadge tone={answer.answer.tone} hi={hi} />
            </div>
            <div style={{ marginTop:17, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color:'#93C5FD', fontSize:10, fontWeight:800 }}>
                {hi ? 'प्रश्न का अर्थ समझा गया' : 'Understood as'}: <span style={{ color:'rgba(245,240,232,0.78)', fontWeight:500 }}>{local(hi, answer.question.understoodAsEn, answer.question.understoodAsHi)}</span>
              </p>
              <h3 className="font-serif text-gold text-xl font-bold mt-3">{local(hi, answer.answer.headlineEn, answer.answer.headlineHi)}</h3>
              <p style={{ color:IVORY, fontSize:13.5, lineHeight:1.85, marginTop:9 }}>{local(hi, answer.answer.textEn, answer.answer.textHi)}</p>
            </div>
          </article>

          {(aiState === 'streaming' || aiText) && (
            <article className="card-royal p-5 sm:p-7" style={{ border:'1px solid rgba(167,139,250,0.35)', background:'linear-gradient(145deg,rgba(167,139,250,0.08),rgba(17,20,40,0.97))' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>✨</span>
                <h3 className="font-serif text-lg font-bold" style={{ color:'#C4B5FD' }}>{hi ? 'एआई उत्तर' : 'AI Answer'}</h3>
                {aiState === 'streaming' && (
                  <span style={{ color:MUTED, fontSize:10.5, marginLeft:'auto' }}>
                    {aiText ? (hi ? 'लिखा जा रहा है…' : 'writing…') : (hi ? 'सोच रहा है…' : 'thinking…')}
                  </span>
                )}
              </div>

              {aiText ? (
                <p style={{ color:IVORY, fontSize:13.5, lineHeight:1.9, marginTop:11, whiteSpace:'pre-line' }}>
                  {aiText}
                  {aiState === 'streaming' && <span className="animate-pulse" style={{ color:'#C4B5FD', fontWeight:700 }}>▍</span>}
                </p>
              ) : (
                /* thinking / first-token wait — circular timer + live elapsed time */
                <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14 }}>
                  <CircleTimer seconds={elapsed} />
                  <div>
                    <p style={{ color:IVORY, fontSize:12.5, fontWeight:600, margin:0 }}>
                      {hi ? 'एआई आपका उत्तर तैयार कर रहा है…' : 'AI is preparing your answer…'}
                    </p>
                    <p style={{ color:MUTED, fontSize:10.5, margin:'4px 0 0' }}>
                      {hi ? `बीता समय: ${elapsed.toFixed(1)} सेकंड` : `Elapsed: ${elapsed.toFixed(1)}s`}
                      {elapsed > 40 && ` · ${hi ? 'लगभग तैयार…' : 'almost there…'}`}
                    </p>
                  </div>
                </div>
              )}
            </article>
          )}

          <section className="card-royal p-5 sm:p-6">
            <h3 className="font-serif text-gold text-lg font-bold">🔭 {hi ? 'किन कुंडलियों को देखा गया' : 'Charts examined for this question'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {answer.chartLenses.map((lens) => (
                <div key={lens.slug} style={{ padding:'13px 14px', borderRadius:10, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'center' }}>
                    <strong style={{ color:IVORY, fontSize:11.5 }}>{local(hi, lens.titleEn, lens.titleHi)}</strong>
                    <ToneBadge tone={lens.status} hi={hi} />
                  </div>
                  <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:7 }}>{local(hi, lens.purposeEn, lens.purposeHi)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card-royal p-5 sm:p-6">
            <h3 className="font-serif text-gold text-lg font-bold">💡 {hi ? 'यह उत्तर क्यों मिला' : 'Why this answer'} </h3>
            <div style={{ display:'grid', gap:10, marginTop:13 }}>
              {answer.reasons.map((reason, index) => (
                <div key={`${reason.titleEn}-${index}`} style={{ padding:'13px 14px', borderRadius:10, border:'1px solid rgba(212,175,55,0.12)', background:'rgba(212,175,55,0.035)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                    <strong style={{ color:'#EAD58B', fontSize:11 }}>{local(hi, reason.titleEn, reason.titleHi)}</strong>
                    <ToneBadge tone={reason.tone} hi={hi} />
                  </div>
                  <p style={{ color:'rgba(245,240,232,0.72)', fontSize:11.5, lineHeight:1.75, marginTop:7 }}>{local(hi, reason.textEn, reason.textHi)}</p>
                </div>
              ))}
            </div>
          </section>

          {answer.timing && (
            <section className="card-royal p-5 sm:p-6" style={{ border:'1px solid rgba(96,165,250,0.2)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <h3 className="font-serif text-gold text-lg font-bold">⏳ {hi ? 'वर्तमान समय' : 'Current timing'}</h3>
                <ToneBadge tone={answer.timing.tone} hi={hi} />
              </div>
              {answer.timing.dateTo && <p style={{ color:'#93C5FD', fontSize:10.5, marginTop:8 }}>{hi ? 'यह समय-खिड़की' : 'Current window'}: {dateLabel(answer.timing.dateFrom, hi)} – {dateLabel(answer.timing.dateTo, hi)}</p>}
              <p style={{ color:'rgba(245,240,232,0.72)', fontSize:11.5, lineHeight:1.75, marginTop:7 }}>{local(hi, answer.timing.textEn, answer.timing.textHi)}</p>
            </section>
          )}

          <section className="card-royal p-5 sm:p-6">
            <h3 className="font-serif text-gold text-lg font-bold">✓ {hi ? 'अब क्या करें' : 'What to do next'}</h3>
            <ol style={{ display:'grid', gap:10, marginTop:13 }}>
              {answer.nextSteps.map((step, index) => (
                <li key={step.en} style={{ display:'grid', gridTemplateColumns:'26px minmax(0,1fr)', gap:10, alignItems:'start' }}>
                  <span style={{ width:25, height:25, display:'grid', placeItems:'center', borderRadius:8, color:GOLD, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.18)', fontSize:10, fontWeight:900 }}>{index + 1}</span>
                  <span style={{ color:'rgba(245,240,232,0.78)', fontSize:11.5, lineHeight:1.7 }}>{local(hi, step.en, step.hi)}</span>
                </li>
              ))}
            </ol>
          </section>

          <div style={{ padding:'12px 14px', borderRadius:10, color:MUTED, background:'rgba(148,163,184,0.055)', border:'1px solid rgba(148,163,184,0.14)', fontSize:10.5, lineHeight:1.65 }}>
            <strong style={{ color:'#CBD5E1' }}>{hi ? 'ध्यान रखें: ' : 'Keep in mind: '}</strong>{local(hi, answer.safety.textEn, answer.safety.textHi)}
          </div>

          <button type="button" onClick={askAnother} className="btn-outline-gold" style={{ justifySelf:'start', padding:'9px 17px' }}>
            {hi ? '← दूसरा प्रश्न पूछें' : '← Ask another question'}
          </button>
        </div>
      )}
    </section>
  );
}
