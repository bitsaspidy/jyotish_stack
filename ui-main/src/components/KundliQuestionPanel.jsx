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

// Fit levels, strongest first. Colour carries the ranking so the order is legible
// without reading every card.
const FIT_STYLE = {
  best_fit:    { color:'#34D399', border:'rgba(52,211,153,0.4)',  bg:'rgba(52,211,153,0.09)' },
  strong:      { color:'#A3E635', border:'rgba(163,230,53,0.35)', bg:'rgba(163,230,53,0.07)' },
  supportive:  { color:'#FBBF24', border:'rgba(251,191,36,0.32)', bg:'rgba(251,191,36,0.06)' },
  conditional: { color:'#FB923C', border:'rgba(251,146,60,0.32)', bg:'rgba(251,146,60,0.06)' },
  lower_fit:   { color:'rgba(245,240,232,0.45)', border:'rgba(255,255,255,0.1)', bg:'rgba(255,255,255,0.02)' },
};

/**
 * Ranked options for a selection question.
 *
 * A selection question asked "which one?", so it gets named options in order —
 * not a favourability badge. Ranks and fit labels are shown; the scores that
 * produced them are admin detail and never sent here.
 */
function SelectionPanel({ selection, hi }) {
  const [open, setOpen] = useState({});
  if (!selection || !selection.options?.length) return null;
  const L = (o) => (hi ? o.hi : o.en);

  return (
    <div style={{ display:'grid', gap:11 }}>
      {selection.options.map((o) => {
        const s = FIT_STYLE[o.fit] || FIT_STYLE.supportive;
        const isOpen = !!open[o.key];
        return (
          <article key={o.key} className="card-royal p-4 sm:p-5"
            style={{ border:`1px solid ${s.border}`, background:s.bg }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <span aria-hidden="true" style={{ color:s.color, fontSize:19, fontWeight:800, minWidth:22, lineHeight:1.3 }}>
                {o.rank}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
                  <h4 className="font-serif text-gold text-base font-bold" style={{ margin:0 }}>{L(o.title)}</h4>
                  <span style={{ color:s.color, border:`1px solid ${s.border}`, background:s.bg, borderRadius:99,
                    padding:'2px 9px', fontSize:9, fontWeight:800 }}>
                    {L(o.fit_label)}
                  </span>
                </div>
                <p style={{ color:'rgba(245,240,232,0.8)', fontSize:12, lineHeight:1.75, marginTop:7 }}>
                  {L(o.reason)}
                </p>
                {o.caution && (
                  <p style={{ color:'#FB923C', fontSize:11.5, lineHeight:1.7, marginTop:6 }}>
                    ⚠ {L(o.caution)}
                  </p>
                )}
                {L(o.examples) && (
                  <>
                    <button type="button" onClick={() => setOpen((x) => ({ ...x, [o.key]: !x[o.key] }))}
                      style={{ background:'none', border:'none', color:'rgba(147,197,253,0.85)', fontSize:10.5,
                        cursor:'pointer', padding:'6px 0 0', fontWeight:600 }}>
                      {isOpen ? (hi ? 'कम दिखाएँ' : 'Show less') : (hi ? 'इसमें क्या आता है?' : 'What this includes')}
                    </button>
                    {isOpen && (
                      <p style={{ color:'rgba(245,240,232,0.55)', fontSize:11, lineHeight:1.7, marginTop:5 }}>
                        {L(o.examples)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}

      {selection.secondary?.length > 0 && (
        <div className="card-royal p-4" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color:MUTED, fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            {hi ? 'सहायक विकल्प' : 'Supporting options'}
          </p>
          <p style={{ color:'rgba(245,240,232,0.7)', fontSize:11.5, lineHeight:1.8, marginTop:6 }}>
            {selection.secondary.map((o) => `${L(o.title)} (${L(o.fit_label)})`).join(' · ')}
          </p>
        </div>
      )}

      {selection.lower?.length > 0 && (
        <div className="card-royal p-4" style={{ border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.015)' }}>
          <p style={{ color:MUTED, fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em' }}>
            {hi ? 'अभी अपेक्षाकृत कम उपयुक्त' : 'Less suitable right now'}
          </p>
          <p style={{ color:'rgba(245,240,232,0.45)', fontSize:11.5, lineHeight:1.8, marginTop:6 }}>
            {selection.lower.map((o) => L(o.title)).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}

function StateBadge({ state, label, hi }) {
  const s = STATE_STYLE[state] || STATE_STYLE.mixed;
  return (
    <span style={{ color:s.color, border:`1px solid ${s.border}`, background:s.bg, borderRadius:99, padding:'5px 11px', fontSize:10, fontWeight:800 }}>
      {local(hi, label?.en, label?.hi) || state}
    </span>
  );
}

// ── Admin evidence inspector ────────────────────────────────────────────────
// Deliberately English-only and unstyled-for-users: this is an engineering view,
// not product copy. It renders what the engine DECIDED and why, so a wrong answer
// can be diagnosed without reading logs.

const ROLE_LABEL = (r) => (r.kind === 'house_lord' ? `${r.house}th lord`
  : r.kind === 'dasha' ? `${r.level} dasha`
  : r.kind === 'varga' ? `varga ${r.chart}`
  : String(r.kind || '').replace(/_/g, ' '));

// What each verdict alignment means, in one line, so the reason the headline
// stands is legible without opening verdict-resolver.js.
const ALIGNMENT_NOTE = {
  primary_agreement:       'Primary evidence agrees with the verdict.',
  secondary_only_conflict: 'A conflict was raised by secondary evidence only — the verdict follows the primary evidence.',
  primary_blocker:         'A strong primary blocker capped the upside.',
  varga_contradiction:     'The relevant divisional chart contradicts a positive birth-chart reading, so the upside was capped.',
  timing_gap:              'The promise is present but the current timing is not active.',
  mixed_primary:           'Primary evidence is genuinely split between support and blockers.',
  primary_caution:         'Primary evidence is cautionary.',
  balanced:                'No single factor decided this.',
};

function Row({ label, children }) {
  return (
    <div style={{ display:'flex', gap:10, padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color:'rgba(245,240,232,0.4)', fontSize:10, minWidth:132, flexShrink:0 }}>{label}</span>
      <span style={{ color:'rgba(245,240,232,0.82)', fontSize:10.5, lineHeight:1.6 }}>{children}</span>
    </div>
  );
}

function FactorList({ items, tone }) {
  if (!items || !items.length) return <span style={{ color:'rgba(245,240,232,0.35)' }}>none</span>;
  return (
    <span style={{ display:'flex', flexDirection:'column', gap:3 }}>
      {items.map((f) => (
        <span key={f.entity_id} style={{ color:tone }}>
          <strong>{f.planet || f.entity_id}</strong>
          {' · '}
          {(f.roles || []).map(ROLE_LABEL).join(' + ')}
          {' · tier '}{f.tier}
          {' · '}{f.score > 0 ? '+' : ''}{f.score}
        </span>
      ))}
    </span>
  );
}

function AdminEvidence({ trace }) {
  const [open, setOpen] = useState(false);
  const v = trace.verdict || {};
  const norm = trace.evidence_normalization || {};
  const keys = [...new Set((trace.templates_used || []).map((t) => t.key || `${t.section}:${t.source}`))];

  return (
    <section className="card-royal p-5 sm:p-6" style={{ border:'1px solid rgba(147,197,253,0.28)', background:'rgba(147,197,253,0.04)' }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ display:'flex', alignItems:'center', gap:9, width:'100%', background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left' }}>
        <span aria-hidden="true">🔬</span>
        <span style={{ color:'#93C5FD', fontSize:12, fontWeight:800, flex:1 }}>
          Admin · answer evidence
          <span style={{ color:'rgba(245,240,232,0.4)', fontWeight:500, marginLeft:8 }}>
            {trace.domain} · {v.alignment}{v.changed ? ` · adjusted from ${v.changed_from}` : ''}
          </span>
        </span>
        <span aria-hidden="true" style={{ color:'#93C5FD', fontSize:11 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:13 }}>
          <Row label="Domain">{trace.domain}</Row>
          <Row label="Intent">
            {trace.intent || '—'}
            {trace.selection && <span style={{ color:'rgba(245,240,232,0.4)' }}> · ranked selection</span>}
          </Row>

          {/* Why each option ranked where it did, and what lost. A recommendation
              someone may act on for years needs an audit trail. */}
          {trace.selection && (
            <>
              <Row label="Direction planet">{trace.selection.dominant_planet || '—'}</Row>
              <Row label="Ranked options">
                <span style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {trace.selection.ranked.slice(0, 6).map((r) => (
                    <span key={r.key}>
                      <strong style={{ color: r.blocked ? '#FB923C' : '#93C5FD' }}>
                        {r.rank}. {r.key.replace(/^education\./, '')}
                      </strong>
                      {' · '}{r.fit}{' · score '}{r.score}
                      {r.blocked && <span style={{ color:'#FB923C' }}> · blocked by {r.blocked_by}</span>}
                      <span style={{ color:'rgba(245,240,232,0.4)', display:'block', fontSize:9.5, paddingLeft:12 }}>
                        {r.contributions.map((c) => (
                          `${c.kind}${c.planet ? `:${c.planet}` : c.chart ? `:${c.chart}` : ''} ${c.delta > 0 ? '+' : ''}${c.delta}`
                        )).join('  ')}
                      </span>
                    </span>
                  ))}
                </span>
              </Row>
              <Row label="Discarded">
                <span style={{ color:'rgba(245,240,232,0.5)', fontSize:10 }}>
                  {trace.selection.discarded.length
                    ? trace.selection.discarded.map((d) => `${d.key.replace(/^education\./, '')} (${d.score}${d.blocked_by ? `, blocked by ${d.blocked_by}` : ''})`).join(' · ')
                    : 'none'}
                </span>
              </Row>
              <Row label="Ranker weights">
                <span style={{ fontFamily:'ui-monospace, monospace', fontSize:9.5, color:'rgba(245,240,232,0.55)' }}>
                  {Object.entries(trace.selection.weights).map(([k, v]) => `${k}=${v}`).join(' · ')}
                  {' · blocker at '}{trace.selection.blocker_at}
                </span>
              </Row>
            </>
          )}

          <Row label="Verdict">
            <strong>{v.state}</strong>
            {v.changed
              ? <span style={{ color:'#FBBF24' }}> (moved from {v.changed_from} by the resolver)</span>
              : <span style={{ color:'rgba(245,240,232,0.4)' }}> (unchanged by the resolver)</span>}
          </Row>
          <Row label="Why it stands">
            {ALIGNMENT_NOTE[v.alignment] || v.alignment}
            {v.primary_reason && (
              <div style={{ color:'rgba(245,240,232,0.5)', marginTop:3 }}>
                Decided by: <strong>{v.primary_reason.planet || v.primary_reason.chart || v.primary_reason.entity_id}</strong>
                {' · tier '}{v.primary_reason.tier}{' · '}{v.primary_reason.score > 0 ? '+' : ''}{v.primary_reason.score}
              </div>
            )}
          </Row>
          <Row label="Primary supports"><FactorList items={trace.primary_supports} tone="#34D399" /></Row>
          <Row label="Primary blockers"><FactorList items={trace.primary_blockers} tone="#FB7185" /></Row>
          <Row label="Timing gap">
            {v.timing_gap
              ? <span style={{ color:'#FBBF24' }}>yes — promise present, current timing inactive</span>
              : 'no'}
          </Row>
          <Row label="Evidence dedup">
            {norm.merged_count} entities after merge · {norm.dropped_duplicates} duplicate role(s) collapsed
            {norm.dropped_duplicates > 0 && (
              <span style={{ color:'rgba(245,240,232,0.45)' }}>
                {' '}({norm.dropped_duplicates_within_groups} within groups, {norm.dropped_duplicates_across_groups} across)
              </span>
            )}
          </Row>
          <Row label="Confidence">
            {trace.confidence_reason_kind || '—'}
          </Row>
          <Row label="Resolver notes">
            {(v.notes || []).length ? (v.notes || []).join(', ') : <span style={{ color:'rgba(245,240,232,0.35)' }}>none</span>}
          </Row>
          <Row label="Charts used">{(trace.charts_available || []).join(', ') || '—'}</Row>
          <Row label="Completeness">{trace.data_completeness != null ? `${trace.data_completeness}%` : '—'}</Row>
          <Row label="Rule keys">{(trace.rule_keys_evaluated || []).join(', ') || '—'}</Row>
          <Row label="Template blocks">
            <span style={{ fontFamily:'ui-monospace, monospace', fontSize:9.5, lineHeight:1.7, color:'rgba(245,240,232,0.6)' }}>
              {keys.length ? keys.join(' · ') : '—'}
            </span>
          </Row>
          <Row label="Versions">
            rule {trace.requirement_version ?? '—'} · template {trace.template_version ?? '—'} · {trace.duration_ms}ms
          </Row>
        </div>
      )}
    </section>
  );
}

/**
 * @param {object} props
 * @param {object} [props.client]        axios instance — admin passes adminApi
 * @param {string} [props.catalogueUrl]  question list endpoint
 * @param {string} [props.answerUrl]     answer endpoint
 *
 * The endpoints are injectable because the admin view answers on behalf of the
 * Kundli's OWNER through an admin-scoped route, while the user view answers for
 * itself. Everything else — the picker, the answer rendering, the evidence
 * inspector — is identical, and a second copy would drift from this one.
 */
export default function KundliQuestionPanel({
  uuid, name, lang,
  client = api,
  catalogueUrl = '/kundli/qa/catalogue',
  answerUrl,
}) {
  const hi = lang === 'hi';
  const askUrl = answerUrl || `/kundli/${uuid}/qa/deterministic`;
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('idle');        // idle | loading | done | error
  const [answer, setAnswer] = useState(null);
  const [trace, setTrace] = useState(null);          // admin-only; the API omits it for normal users
  const [asked, setAsked] = useState(null);          // the question object that was asked
  const [message, setMessage] = useState('');
  // The catalogue has its OWN state. Previously a failed load and an empty
  // response both left `categories` at [], which rendered "Loading the question
  // list…" forever — the panel looked permanently empty and said nothing about
  // why. Tracking it explicitly is what lets the three cases differ.
  const [catState, setCatState] = useState('loading');   // loading | ready | empty | error
  const [catError, setCatError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Load the approved question catalogue (DB-backed, pilot questions only).
  useEffect(() => {
    let alive = true;
    setCatState('loading');
    setCatError('');
    client.get(catalogueUrl)
      .then(({ data }) => {
        if (!alive) return;
        const cats = data?.categories || [];
        // Defensive: only categories that actually carry questions can be shown.
        // The admin-scoped catalogue returns a DIFFERENT shape (flat `questions`,
        // no nested list), so a shape mismatch must read as "empty", never as a
        // silent set of tabs with nothing behind them.
        const usable = cats.filter((c) => Array.isArray(c.questions) && c.questions.length > 0);
        if (!usable.length) { setCatState('empty'); return; }
        setCategories(usable);
        setActiveCat(usable[0].code);
        setCatState('ready');
      })
      .catch((error) => {
        if (!alive) return;
        setCatError(error.response?.data?.message || '');
        setCatState('error');
      });
    return () => { alive = false; };
  }, [reloadKey, catalogueUrl, client]);

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
      const { data } = await client.post(askUrl, { questionCode: question.code, lang });
      setAnswer(data.answer);
      // Present for admins only — the route attaches `trace` by role, so its mere
      // presence is the admin signal. No role prop, and no way for a normal user's
      // payload to light this up.
      setTrace(data.trace || null);
      setState('done');
    } catch (error) {
      const msg = error.response?.data?.message
        || (hi ? 'अभी उत्तर तैयार नहीं हो पाया। कृपया कुछ देर बाद पुनः प्रयास करें।' : 'The answer could not be prepared right now. Please try again shortly.');
      setMessage(msg);
      setState('error');
    }
  };

  const askAnother = () => { setAnswer(null); setTrace(null); setAsked(null); setMessage(''); setState('idle'); };

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
          {!search.trim() && catState === 'ready' && categories.length > 0 && (
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
            {catState === 'ready' && visibleQuestions.length === 0 && (
              <p style={{ color:MUTED, fontSize:11, padding:'10px 2px' }}>
                {hi ? 'इस खोज से कोई प्रश्न नहीं मिला।' : 'No questions match this search.'}
              </p>
            )}

            {catState === 'loading' && (
              <p style={{ color:MUTED, fontSize:11, padding:'10px 2px' }}>
                {hi ? 'प्रश्न सूची लोड हो रही है…' : 'Loading the question list…'}
              </p>
            )}

            {/* The catalogue answered, but with nothing to show. This is a real
                server-side state (no question is both rule-implemented and fully
                templated), so it gets a real message instead of a spinner that
                never resolves. */}
            {catState === 'empty' && (
              <div role="status" style={{ padding:'12px 14px', borderRadius:9, border:'1px solid rgba(251,191,36,0.25)', background:'rgba(251,191,36,0.06)' }}>
                <p style={{ color:'#FBBF24', fontSize:11.5, fontWeight:700 }}>
                  {hi ? 'अभी कोई प्रश्न उपलब्ध नहीं है।' : 'No questions are available right now.'}
                </p>
                <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:5 }}>
                  {hi
                    ? 'प्रश्न सूची तैयार होते ही यहाँ दिखाई देगी। कृपया कुछ देर बाद पुनः प्रयास करें।'
                    : 'The question list will appear here once it is ready. Please try again shortly.'}
                </p>
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-outline-gold" style={{ marginTop:10, padding:'6px 13px', fontSize:10.5 }}>
                  {hi ? 'पुनः प्रयास करें' : 'Retry'}
                </button>
              </div>
            )}

            {catState === 'error' && (
              <div role="alert" style={{ padding:'12px 14px', borderRadius:9, border:'1px solid rgba(239,68,68,0.22)', background:'rgba(239,68,68,0.07)' }}>
                <p style={{ color:'#FCA5A5', fontSize:11.5, fontWeight:700 }}>
                  {hi ? 'प्रश्न सूची लोड नहीं हो सकी।' : 'The question list could not be loaded.'}
                </p>
                {catError && (
                  <p style={{ color:MUTED, fontSize:10.5, lineHeight:1.6, marginTop:5 }}>{catError}</p>
                )}
                <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn-outline-gold" style={{ marginTop:10, padding:'6px 13px', fontSize:10.5 }}>
                  {hi ? 'पुनः प्रयास करें' : 'Retry'}
                </button>
              </div>
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
                {/* A selection answer's headline is its direction, so a
                    favourable/mixed badge beside it would answer a different
                    question and undercut the ranking. Confidence still applies. */}
                {!answer.selection && <StateBadge state={answer.state} label={answer.state_label} hi={hi} />}
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

            {/* Why this confidence. A bare "Confidence: High" asks the reader to
                trust a level they cannot inspect; the engine now explains which
                evidence agreed (or disagreed), so show it. Names evidence only —
                never a score. */}
            {local(hi, answer.confidence?.reason_en, answer.confidence?.reason_hi) && (
              <p style={{ color:MUTED, fontSize:11, lineHeight:1.7, marginTop:11, paddingTop:11, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span aria-hidden="true" style={{ marginRight:6 }}>💡</span>
                {local(hi, answer.confidence.reason_en, answer.confidence.reason_hi)}
              </p>
            )}
          </article>

          {/* Ranked options come first: they ARE the answer to "which one?".
              The narrative sections below then explain and qualify them. */}
          {answer.selection && (
            <div>
              <h3 className="font-serif text-gold text-base font-bold" style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
                <span aria-hidden="true">🎯</span>
                {hi ? 'सबसे उपयुक्त क्षेत्र' : 'Most suitable options'}
              </h3>
              <SelectionPanel selection={answer.selection} hi={hi} />
            </div>
          )}

          {(answer.sections || [])
            // For a ranked answer the direct answer IS the cards above; rendering
            // it again as a paragraph would repeat the entire list.
            .filter((s) => !(answer.selection && s.key === 'direct_answer'))
            .map((s) => (
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

          {/* Admin-only evidence inspector. Rendered purely because `trace` is
              present, which the API attaches by role — a normal user's payload has
              no trace, so there is nothing here for them to reveal. */}
          {trace && <AdminEvidence trace={trace} />}

          <button type="button" onClick={askAnother} className="btn-outline-gold" style={{ justifySelf:'start', padding:'9px 17px' }}>
            {hi ? '← दूसरा प्रश्न चुनें' : '← Choose another question'}
          </button>
        </div>
      )}
    </section>
  );
}
