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
 *     answer — code only picks keys — so reviewing it meant opening phpMyAdmin.
 *     Read-only here on purpose: edits ship as seed revisions so they stay
 *     reproducible.
 */

import { useEffect, useState, useMemo } from 'react';
import adminApi from '../lib/adminApi';

const GOLD = '#D4AF37';
const IVORY = '#F5F0E8';
const MUTED = 'rgba(245,240,232,0.5)';

const READINESS = {
  pilot:    { label: 'answerable', color: '#34D399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)' },
  planned:  { label: 'not ready',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)' },
  disabled: { label: 'disabled',   color: '#FB7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.3)' },
};

const BLOCK_GROUPS = [
  { label: 'Direct answers',  prefix: 'direct_answer.' },
  { label: 'Cautions',        prefix: 'caution.' },
  { label: 'Next steps',      prefix: 'action.' },
  { label: 'Planet meanings', prefix: 'meaning.' },
  { label: 'Varga meanings',  prefix: 'varga.' },
  { label: 'Timing',          prefix: 'timing.' },
  { label: 'Confidence',      prefix: 'confidence.' },
  { label: 'Frames & roles',  prefix: 'frag.' },
];

const cell = { padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11.5, verticalAlign: 'top' };
const th = { color: 'rgba(212,175,55,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left', paddingBottom: 10 };

function Badge({ status }) {
  const s = READINESS[status] || READINESS.planned;
  return (
    <span style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 99, padding: '3px 9px', fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: '1 1 130px', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10, padding: '13px 15px', background: 'rgba(255,255,255,0.02)' }}>
      <p style={{ color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ color: color || GOLD, fontSize: 22, fontWeight: 800, marginTop: 3 }}>{value}</p>
    </div>
  );
}

function TabBtn({ on, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      style={{ color: on ? '#0a0c1c' : 'rgba(245,240,232,0.65)', background: on ? GOLD : 'rgba(255,255,255,0.04)',
        border: `1px solid ${on ? GOLD : 'rgba(255,255,255,0.1)'}`, borderRadius: 99, padding: '6px 13px',
        fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

// ── Coverage ────────────────────────────────────────────────────────────────
function Coverage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    adminApi.get('/kundli/qa/catalogue', { params: { scope: 'admin' } })
      .then(({ data }) => { if (alive) { setRows(data.questions || []); setLoading(false); } })
      .catch((e) => {
        if (!alive) return;
        // Surfaced, not swallowed — a silent catch is what made the user-side
        // question panel look permanently empty.
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

  const tally = useMemo(() => rows.reduce((a, r) => { a[r.readiness] = (a[r.readiness] || 0) + 1; return a; }, {}), [rows]);
  const domains = useMemo(() => new Set(rows.filter((r) => r.readiness === 'pilot').map((r) => r.domain)), [rows]);

  if (loading) return <p style={{ color: MUTED, fontSize: 12 }}>Loading the question catalogue…</p>;
  if (error) return <p style={{ color: '#FCA5A5', fontSize: 12 }}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat label="Questions" value={rows.length} />
        <Stat label="Answerable" value={tally.pilot || 0} color="#34D399" />
        <Stat label="Not ready" value={tally.planned || 0} color="#FBBF24" />
        <Stat label="Live domains" value={domains.size} />
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginBottom: 13 }}>
        <TabBtn on={filter === 'all'} onClick={() => setFilter('all')}>All</TabBtn>
        <TabBtn on={filter === 'pilot'} onClick={() => setFilter('pilot')}>Answerable</TabBtn>
        <TabBtn on={filter === 'planned'} onClick={() => setFilter('planned')}>Not ready</TabBtn>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, question or domain…"
          className="input-royal" style={{ marginLeft: 'auto', minWidth: 240, fontSize: 11, padding: '6px 10px' }} />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Code', 'Question', 'Domain', 'Category', 'Status', 'Missing'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.code}>
                <td style={{ ...cell, color: IVORY, fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>{r.code}</td>
                <td style={{ ...cell, color: 'rgba(245,240,232,0.75)', maxWidth: 340 }}>{r.question_en}</td>
                <td style={cell}>
                  <span style={{ color: 'rgba(245,240,232,0.6)', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '2px 7px', fontSize: 10 }}>
                    {r.domain || '—'}
                  </span>
                </td>
                <td style={{ ...cell, color: MUTED, fontSize: 10 }}>{r.category_code}</td>
                <td style={cell}><Badge status={r.readiness} /></td>
                <td style={{ ...cell, color: MUTED, fontSize: 10, maxWidth: 220 }}>
                  {r.readiness === 'pilot'
                    ? <span style={{ color: 'rgba(52,211,153,0.5)' }}>—</span>
                    : !r.has_rule
                      ? <span title="No deterministic rule implementation exists for this question yet.">no rule</span>
                      : (r.missing || []).length
                        ? <span title={(r.missing || []).join('\n')}>
                            {(r.missing || []).slice(0, 2).join(', ')}{(r.missing || []).length > 2 ? ` +${r.missing.length - 2} more` : ''}
                          </span>
                        : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p style={{ color: MUTED, fontSize: 11, padding: '12px 2px' }}>No questions match this filter.</p>}
      </div>

      <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: 9.5, lineHeight: 1.7, marginTop: 12 }}>
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
    adminApi.get('/kundli/qa/blocks', { params: { prefix: group.prefix } })
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

  const retired = useMemo(() => new Set(blocks.filter((b) => !b.active).map((b) => b.block_key)).size, [blocks]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginBottom: 13 }}>
        {BLOCK_GROUPS.map((g) => (
          <TabBtn key={g.prefix} on={g.prefix === group.prefix} onClick={() => setGroup(g)}>{g.label}</TabBtn>
        ))}
        {retired > 0 && (
          <label style={{ color: MUTED, fontSize: 10, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', cursor: 'pointer' }}>
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
            Show retired ({retired})
          </label>
        )}
      </div>

      {loading && <p style={{ color: MUTED, fontSize: 12 }}>Loading…</p>}
      {error && <p style={{ color: '#FCA5A5', fontSize: 12 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Key', 'English', 'हिन्दी'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {pairs.map((p) => (
                  <tr key={p.key} style={{ opacity: p.active ? 1 : 0.45 }}>
                    <td style={{ ...cell, fontFamily: 'ui-monospace, monospace', fontSize: 9, color: 'rgba(245,240,232,0.55)', maxWidth: 190, wordBreak: 'break-all' }}>
                      {p.key}
                      {!p.active && <span style={{ color: '#FB7185', marginLeft: 6, fontSize: 8 }}>retired</span>}
                    </td>
                    <td style={{ ...cell, color: 'rgba(245,240,232,0.78)', maxWidth: 330, lineHeight: 1.65 }}>
                      {p.en || <span style={{ color: '#FCA5A5' }}>missing</span>}
                    </td>
                    <td style={{ ...cell, color: 'rgba(245,240,232,0.78)', maxWidth: 330, lineHeight: 1.75 }}>
                      {p.hi || <span style={{ color: '#FCA5A5' }}>missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pairs.length && <p style={{ color: MUTED, fontSize: 11, padding: '12px 2px' }}>No content in this group.</p>}
          </div>
          <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: 9.5, lineHeight: 1.7, marginTop: 12 }}>
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
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card-royal p-5 sm:p-6">
        <h2 className="font-serif text-gold text-xl font-bold">Kundli Q&A</h2>
        <p style={{ color: MUTED, fontSize: 11.5, lineHeight: 1.7, marginTop: 5 }}>
          Which questions can be answered, and the content their answers are built from.
        </p>
      </div>

      <div className="card-royal p-5 sm:p-6">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <TabBtn on={tab === 'coverage'} onClick={() => setTab('coverage')}>Question coverage</TabBtn>
          <TabBtn on={tab === 'content'} onClick={() => setTab('content')}>Answer content</TabBtn>
        </div>
        {tab === 'coverage' ? <Coverage /> : <Content />}
      </div>
    </div>
  );
}
