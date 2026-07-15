'use client';

/**
 * Admin — Kundli Q&A coverage + answer content.
 *
 * Two things an admin could not see before:
 *
 *  1. COVERAGE. Which of the 100 catalogue questions can actually be answered,
 *     which life area each speaks in, and — for the ones that cannot — exactly
 *     what is missing. The API behind this existed and was fully tested but had
 *     no caller, so the readiness gate was invisible: questions simply did not
 *     appear for users and nothing said why.
 *
 *  2. CONTENT. The seeded answer text itself. On this product the content IS the
 *     answer — code only picks keys — so reviewing it through phpMyAdmin was the
 *     only option. Read-only here on purpose: editing belongs to the knowledge CMS.
 */

import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';

const READINESS_BADGE = {
  pilot:    'badge-active',
  planned:  'badge-pending',
  disabled: 'badge-inactive',
};

// The content families seeded for each domain, as browsable prefixes.
const BLOCK_GROUPS = [
  { label: 'Direct answers', prefix: 'direct_answer.' },
  { label: 'Cautions',       prefix: 'caution.' },
  { label: 'Next steps',     prefix: 'action.' },
  { label: 'Planet meanings', prefix: 'meaning.' },
  { label: 'Varga meanings', prefix: 'varga.' },
  { label: 'Timing',         prefix: 'timing.' },
  { label: 'Confidence',     prefix: 'confidence.' },
  { label: 'Frames & roles', prefix: 'frag.' },
];

function Stat({ label, value, tone }) {
  return (
    <div className="admin-card flex-1 min-w-[130px]">
      <p className="text-ivory/40 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone || 'text-gold'}`}>{value}</p>
    </div>
  );
}

// ── Coverage ────────────────────────────────────────────────────────────────
function Coverage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');   // all | pilot | planned
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/kundli/qa/catalogue', { params: { scope: 'admin' } })
      .then(({ data }) => {
        if (!alive) return;
        setRows(data.questions || []);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        // Surfaced, not swallowed: a silent catch here is what made the user-side
        // panel look permanently empty.
        setError(e.response?.data?.message || 'Could not load the question catalogue.');
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && r.readiness !== filter) return false;
      if (!q) return true;
      return (r.code || '').toLowerCase().includes(q)
        || (r.question_en || '').toLowerCase().includes(q)
        || (r.domain || '').toLowerCase().includes(q);
    });
  }, [rows, filter, search]);

  const byReadiness = useMemo(
    () => rows.reduce((a, r) => { a[r.readiness] = (a[r.readiness] || 0) + 1; return a; }, {}),
    [rows],
  );
  const domains = useMemo(() => new Set(rows.filter((r) => r.readiness === 'pilot').map((r) => r.domain)), [rows]);

  if (loading) return <p className="text-ivory/50 text-sm">Loading the question catalogue…</p>;
  if (error) return <div className="admin-card"><p className="text-red-400 text-sm">{error}</p></div>;

  return (
    <div>
      <div className="flex gap-3 flex-wrap mb-5">
        <Stat label="Questions" value={rows.length} />
        <Stat label="Answerable" value={byReadiness.pilot || 0} tone="text-emerald-400" />
        <Stat label="Not ready" value={byReadiness.planned || 0} tone="text-amber-400" />
        <Stat label="Live domains" value={domains.size} />
      </div>

      <div className="flex gap-2 flex-wrap mb-4 items-center">
        {['all', 'pilot', 'planned'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded ${filter === f ? 'bg-gold/15 text-gold' : 'text-ivory/50 hover:text-ivory bg-white/5'}`}>
            {f === 'pilot' ? 'Answerable' : f === 'planned' ? 'Not ready' : 'All'}
          </button>
        ))}
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, question or domain…"
          className="admin-input text-xs ml-auto min-w-[240px]" />
      </div>

      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>{['Code', 'Question', 'Domain', 'Category', 'Status', 'Missing'].map((h) => (
              <th key={h} className="text-gold/70 text-xs uppercase tracking-wider pb-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code}>
                <td className="py-3 border-t border-white/5 text-ivory/80 font-mono text-xs">{r.code}</td>
                <td className="py-3 border-t border-white/5 text-ivory/70 max-w-md">{r.question_en}</td>
                <td className="py-3 border-t border-white/5">
                  <span className="text-xs bg-white/5 text-ivory/60 px-2 py-0.5 rounded">{r.domain || '—'}</span>
                </td>
                <td className="py-3 border-t border-white/5 text-ivory/40 text-xs">{r.category_code}</td>
                <td className="py-3 border-t border-white/5">
                  <span className={READINESS_BADGE[r.readiness] || 'badge-pending'}>
                    {r.readiness === 'pilot' ? 'answerable' : r.readiness}
                  </span>
                </td>
                <td className="py-3 border-t border-white/5 text-ivory/40 text-xs max-w-xs">
                  {r.readiness === 'pilot'
                    ? <span className="text-emerald-400/60">—</span>
                    : !r.has_rule
                      ? <span title="No deterministic rule implementation exists for this question yet.">no rule</span>
                      : (r.missing || []).length
                        ? <span title={(r.missing || []).join('\n')}>{(r.missing || []).slice(0, 2).join(', ')}{(r.missing || []).length > 2 ? ` +${r.missing.length - 2}` : ''}</span>
                        : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="text-ivory/40 text-sm py-4">No questions match this filter.</p>}
      </div>

      <p className="text-ivory/30 text-xs mt-3 leading-relaxed">
        A question reaches users only when it is active, has a deterministic rule, and has complete
        bilingual content for its domain. “Not ready” questions are hidden from users by design —
        hover “Missing” to see what each one still needs.
      </p>
    </div>
  );
}

// ── Content browser ─────────────────────────────────────────────────────────
function Content() {
  const [group, setGroup] = useState(BLOCK_GROUPS[0]);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRetired, setShowRetired] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.get('/kundli/qa/blocks', { params: { prefix: group.prefix } })
      .then(({ data }) => { if (alive) { setBlocks(data.blocks || []); setLoading(false); } })
      .catch((e) => {
        if (!alive) return;
        setError(e.response?.data?.message || 'Could not load answer content.');
        setLoading(false);
      });
    return () => { alive = false; };
  }, [group]);

  // Pair en/hi on one row: the two languages are one piece of content, and
  // reviewing them apart is how a translation drifts from its original.
  const pairs = useMemo(() => {
    const byKey = new Map();
    for (const b of blocks) {
      if (!showRetired && !b.active) continue;
      const e = byKey.get(b.block_key) || { key: b.block_key, active: b.active };
      e[b.lang] = b.text;
      e.active = e.active && b.active;
      byKey.set(b.block_key, e);
    }
    return [...byKey.values()];
  }, [blocks, showRetired]);

  const retiredCount = useMemo(
    () => new Set(blocks.filter((b) => !b.active).map((b) => b.block_key)).size,
    [blocks],
  );

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        {BLOCK_GROUPS.map((g) => (
          <button key={g.prefix} onClick={() => setGroup(g)}
            className={`text-xs px-3 py-1.5 rounded ${g.prefix === group.prefix ? 'bg-gold/15 text-gold' : 'text-ivory/50 hover:text-ivory bg-white/5'}`}>
            {g.label}
          </button>
        ))}
        {retiredCount > 0 && (
          <label className="text-ivory/50 text-xs flex items-center gap-2 ml-auto cursor-pointer">
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
            Show retired ({retiredCount})
          </label>
        )}
      </div>

      {loading && <p className="text-ivory/50 text-sm">Loading…</p>}
      {error && <div className="admin-card"><p className="text-red-400 text-sm">{error}</p></div>}

      {!loading && !error && (
        <>
          <div className="admin-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>{['Key', 'English', 'हिन्दी'].map((h) => (
                  <th key={h} className="text-gold/70 text-xs uppercase tracking-wider pb-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pairs.map((p) => (
                  <tr key={p.key} className={p.active ? '' : 'opacity-45'}>
                    <td className="py-3 border-t border-white/5 align-top">
                      <span className="font-mono text-[10px] text-ivory/60 break-all">{p.key}</span>
                      {!p.active && <span className="badge-inactive ml-2 text-[9px]">retired</span>}
                    </td>
                    <td className="py-3 border-t border-white/5 text-ivory/75 align-top max-w-md text-xs leading-relaxed">{p.en || <span className="text-red-400/70">missing</span>}</td>
                    <td className="py-3 border-t border-white/5 text-ivory/75 align-top max-w-md text-xs leading-relaxed">{p.hi || <span className="text-red-400/70">missing</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pairs.length && <p className="text-ivory/40 text-sm py-4">No content in this group.</p>}
          </div>
          <p className="text-ivory/30 text-xs mt-3 leading-relaxed">
            {pairs.length} entries. This is the text users actually read — code only selects which key
            to show. Read-only here; content changes ship as a seed revision so they stay reproducible.
          </p>
        </>
      )}
    </div>
  );
}

export default function Questions() {
  const [tab, setTab] = useState('coverage');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-1">Kundli Q&A</h1>
      <p className="text-ivory/40 text-sm mb-6">
        Which questions can be answered, and the content their answers are built from.
      </p>

      <div className="flex gap-2 mb-6">
        {[['coverage', 'Question coverage'], ['content', 'Answer content']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-sm px-4 py-2 rounded ${tab === k ? 'bg-gold/15 text-gold' : 'text-ivory/50 hover:text-ivory bg-white/5'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coverage' ? <Coverage /> : <Content />}
    </div>
  );
}
