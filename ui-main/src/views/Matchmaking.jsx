'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── Score colour helper ───────────────────────────────────────────────────────
function scoreColor(total) {
  if (total >= 32) return '#10B981';
  if (total >= 25) return '#22C55E';
  if (total >= 18) return '#F59E0B';
  return '#EF4444';
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase',
      letterSpacing: '0.13em', marginBottom: 12,
      borderBottom: '1px solid rgba(212,175,55,0.13)', paddingBottom: 7,
    }}>{children}</div>
  );
}

// ── Rajju + Vedha panel ───────────────────────────────────────────────────────
function RajjuVedhaSection({ rajju, vedha, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const items = [
    rajju && {
      key: 'rajju',
      name:    T('Rajju', 'राज्जु'),
      desc:    T(rajju.description_en, rajju.description_hi),
      detail:  T(`Boy: ${rajju.boy_group} · Girl: ${rajju.girl_group}`,
                 `वर: ${rajju.boy_group_hi} · वधू: ${rajju.girl_group_hi}`),
      has_dosha: rajju.has_dosha,
      dosha_label: T(rajju.dosha_name, rajju.dosha_name_hi),
      status:  T(rajju.status_en, rajju.status_hi),
    },
    vedha && {
      key: 'vedha',
      name:    T('Vedha', 'वेध'),
      desc:    T(vedha.description_en, vedha.description_hi),
      detail:  T(`Nak ${vedha.boy_nak_num} (Boy) · Nak ${vedha.girl_nak_num} (Girl)`,
                 `नक्ष ${vedha.boy_nak_num} (वर) · नक्ष ${vedha.girl_nak_num} (वधू)`),
      has_dosha: vedha.has_dosha,
      dosha_label: T(vedha.dosha_name, vedha.dosha_name_hi),
      status:  T(vedha.status_en, vedha.status_hi),
    },
  ].filter(Boolean);

  return (
    <div style={{ marginTop: 20 }}>
      <SectionHeading>{T('Rajju & Vedha (Dashakoot Extras)', 'राज्जु और वेध (दशकूट विस्तार)')}</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
        {items.map((item) => {
          const color = item.has_dosha ? '#EF4444' : '#10B981';
          return (
            <div key={item.key} style={{
              padding: '12px 14px', borderRadius: 10,
              background: item.has_dosha ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)',
              border: `1px solid ${color}30`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>{item.desc}</div>
                </div>
                {item.has_dosha ? (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#EF4444',
                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                    padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', flexShrink: 0, marginLeft: 8,
                  }}>{item.dosha_label || 'Dosha'}</span>
                ) : (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: '#10B981',
                    background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
                    padding: '2px 7px', borderRadius: 8, flexShrink: 0, marginLeft: 8,
                  }}>✓ {T('Clear', 'शुद्ध')}</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.55, marginBottom: 7 }}>{item.status}</div>
              <div style={{ fontSize: 9, color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mangal dosha sub-panel ────────────────────────────────────────────────────
function MangalSection({ mangal, mangal_note_en, mangal_note_hi, mangal_compatible, lang }) {
  const T = (en, hi) => lang === 'hi' ? hi : en;
  const ok = mangal_compatible;

  return (
    <div style={{ marginTop: 20 }}>
      <SectionHeading>{T('Mangal (Mars) Compatibility', 'मंगल अनुकूलता')}</SectionHeading>

      {/* Compatibility verdict */}
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 12,
        background: ok ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
        border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ok ? '#10B981' : '#EF4444', marginBottom: 4 }}>
          {ok ? T('✓ Mangal Compatible', '✓ मंगल अनुकूल') : T('⚠ Mangal Mismatch', '⚠ मंगल असंगति')}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.65)', lineHeight: 1.7 }}>
          {T(mangal_note_en, mangal_note_hi) || '—'}
        </div>
      </div>

      {/* Boy / Girl cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: T('Boy (Var)', 'वर'), data: mangal?.boy },
          { label: T('Girl (Vadhu)', 'वधू'), data: mangal?.girl },
        ].map(({ label, data }) => {
          const ac = data?.active_count || 0;
          const tc = ac >= 3 ? '#EF4444' : ac === 2 ? '#F97316' : ac === 1 ? '#F59E0B' : '#10B981';
          return (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.025)', border: `1px solid ${tc}22`,
            }}>
              <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>

              {data?.has_dosha ? (
                <>
                  {/* Type badge */}
                  <div style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 700, color: tc,
                    background: `${tc}15`, border: `1px solid ${tc}35`,
                    padding: '3px 10px', borderRadius: 8, marginBottom: 8,
                  }}>
                    {T(data.manglik_type, data.manglik_type_hi)}
                  </div>

                  {/* Severity */}
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8 }}>
                    {T(`Severity: ${data.severity}`, `प्रभाव स्तर: ${data.severity}`)}
                  </div>

                  {/* Active check chips */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {data.checks?.filter((c) => c.has_dosha).map((c) => (
                      <span key={c.basis} style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 7,
                        background: `${tc}15`, border: `1px solid ${tc}30`, color: tc,
                      }}>
                        {T(`H${c.house} from ${c.basis}`, `${c.basis_hi || c.basis} भाव ${c.house}`)}
                      </span>
                    ))}
                  </div>

                  {/* Cancellations */}
                  {data.cancellations?.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 7 }}>
                      {data.cancellations.map((c, i) => (
                        <div key={i} style={{ fontSize: 10, color: '#22C55E', lineHeight: 1.6, marginBottom: 2 }}>
                          ◈ {T(c.en || c, c.hi || c)}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>
                  {T('Not Manglik', 'मांगलिक नहीं')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main result panel ─────────────────────────────────────────────────────────
function ResultPanel({ result, lang }) {
  if (!result) return null;
  const T   = (en, hi) => lang === 'hi' ? hi : en;
  const sc  = scoreColor(result.total);
  const pct = (result.total / 36) * 100;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${sc}35` }}>

      {/* ── Header: ring + verdict ── */}
      <div style={{
        padding: '20px 24px', background: 'rgba(17,20,40,0.75)',
        display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Conic ring */}
        <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: `conic-gradient(${sc} ${pct}%, rgba(255,255,255,0.07) ${pct}%)`,
          }} />
          <div style={{
            position: 'absolute', top: 9, left: 9, width: 78, height: 78,
            borderRadius: '50%', background: '#0a0c1c',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', lineHeight: 1 }}>{result.total}</span>
            <span style={{ fontSize: 9, color: '#475569' }}>/36</span>
          </div>
        </div>

        {/* Verdict text */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>
            {T('Ashtakoot + Rajju-Vedha (Dashakoot)', 'अष्टकूट + राज्जु-वेध (दशकूट)')}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: sc, marginBottom: 7 }}>
            {T(result.verdict_en, result.verdict_hi) || result.verdict}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.65)', lineHeight: 1.8 }}>
            {T(result.summary_en, result.summary_hi)}
          </div>
        </div>

        {/* Dosha count pills */}
        {result.active_dosha_count >= 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              padding: '7px 14px', textAlign: 'center',
              background: result.active_dosha_count > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${result.active_dosha_count > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              borderRadius: 9,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: result.active_dosha_count > 0 ? '#EF4444' : '#10B981' }}>
                {result.active_dosha_count}
              </div>
              <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {T('Doshas', 'दोष')}
              </div>
            </div>
            <div style={{
              padding: '7px 14px', textAlign: 'center',
              background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 9,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#D4AF37' }}>{result.percentage}%</div>
              <div style={{ fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {T('Score', 'स्कोर')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ background: 'rgba(10,12,28,0.5)', padding: '0 20px 24px' }}>

        {/* 8 Koot grid */}
        <div style={{ paddingTop: 20, marginBottom: 4 }}>
          <SectionHeading>{T('8 Koot Analysis', '8 कूट विश्लेषण')}</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 8 }}>
            {result.kootas?.map((k) => {
              const kpct  = Math.min(100, (k.score / k.max) * 100);
              const kcolor = k.status?.color || (k.score === 0 ? '#EF4444' : k.score === k.max ? '#10B981' : '#F59E0B');
              return (
                <div key={k.name} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${k.has_dosha ? 'rgba(239,68,68,0.25)' : kcolor + '22'}`,
                }}>
                  {/* Name + score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>
                        {k.name}
                        {k.name_hi && <span style={{ color: '#64748B', fontSize: 10, marginLeft: 5 }}>· {k.name_hi}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                        {T(k.description_en, k.description_hi) || ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: kcolor, flexShrink: 0, marginLeft: 8 }}>
                      {k.score}/{k.max}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${kpct}%`, height: '100%', background: kcolor, borderRadius: 5 }} />
                  </div>

                  {/* Status + dosha badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.5, flex: 1 }}>
                      {T(k.status_en, k.status_hi) || ''}
                    </div>
                    {k.has_dosha ? (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#EF4444',
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                        padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', flexShrink: 0,
                      }}>{T(k.dosha_name, k.dosha_name_hi) || 'Dosha'}</span>
                    ) : k.score === k.max ? (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#10B981',
                        background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
                        padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                      }}>✓ Full</span>
                    ) : null}
                  </div>

                  {/* Details */}
                  <div style={{
                    fontSize: 9, color: '#475569', marginTop: 7,
                    borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6,
                  }}>
                    {T(k.details, k.details_hi) || k.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rajju + Vedha section */}
        {(result.rajju || result.vedha) && (
          <RajjuVedhaSection rajju={result.rajju} vedha={result.vedha} lang={lang} />
        )}

        {/* Mangal section */}
        <MangalSection
          mangal={result.mangal}
          mangal_note_en={result.mangal_note_en}
          mangal_note_hi={result.mangal_note_hi}
          mangal_compatible={result.mangal_compatible}
          lang={lang}
        />

        {/* Disclaimer */}
        <div style={{
          marginTop: 16, fontSize: 10, color: '#475569', lineHeight: 1.7,
          padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
        }}>
          {result.note}
        </div>
      </div>
    </div>
  );
}

export default function Matchmaking() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ boy_kundli_id: '', girl_kundli_id: '' });
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState(null);

  const t = (en, hi) => (lang === 'hi' ? hi : en);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  const load = async () => {
    try {
      const [kundliRes, matchRes] = await Promise.all([
        api.get('/kundli'),
        api.get('/kundli/matchmaking/list'),
      ]);
      const nextProfiles = kundliRes.data.profiles || [];
      setProfiles(nextProfiles);
      setRequests(matchRes.data.requests || []);
      setForm((current) => ({
        boy_kundli_id: current.boy_kundli_id || nextProfiles.find((p) => p.gender === 'male')?.uuid || nextProfiles[0]?.uuid || '',
        girl_kundli_id: current.girl_kundli_id || nextProfiles.find((p) => p.gender === 'female')?.uuid || nextProfiles[1]?.uuid || '',
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to load matchmaking');
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/kundli/matchmaking/request', form);
      setLatest(data.request);
      toast.success(t('Match calculated', 'Milan calculate ho gaya'));
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to calculate match');
    } finally {
      setBusy(false);
    }
  };

  const downloadMatchPdf = async (request) => {
    try {
      const response = await api.get(`/kundli/matchmaking/${request.uuid}/report.pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${request.boy_name}-${request.girl_name}-match.pdf`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to export match PDF');
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gold">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={70} />
      <div className="relative z-10 max-w-8xl mx-auto">
        <div className="mb-8">
          <p className="text-gold/50 text-xs uppercase tracking-[0.35em]">{t('Compatibility', 'वैवाहिक अनुकूलता')}</p>
          <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold mt-2">
            {t('Kundli Matchmaking', 'कुंडली मिलान')}
          </h1>
          <p className="text-ivory/55 text-sm mt-2 max-w-2xl">
            {t('Ashtakoot Guna Milan (36 gunas), Manglik Dosha analysis, match history, and PDF export.', 'अष्टकूट गुण मिलान (36 गुण), मांगलिक दोष विश्लेषण, इतिहास और PDF निर्यात।')}
          </p>
        </div>

        {profiles.length < 2 ? (
          <div className="card-royal p-10 text-center">
            <h2 className="font-serif text-gold text-2xl mb-2">{t('Two Kundlis Required', 'दो कुंडली आवश्यक')}</h2>
            <p className="text-ivory/55 text-sm mb-5">{t('Create at least two Kundli profiles (boy and girl) to run Guna Milan.', 'गुण मिलान के लिए कम से कम दो कुंडली (वर और वधू) बनाएं।')}</p>
            <Link href="/kundli/new" className="btn-gold text-sm px-5 py-2">{t('Create Kundli', 'कुंडली बनाएं')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 space-y-5">
              <form onSubmit={submit} className="card-royal p-5">
                <h2 className="font-serif text-gold text-xl mb-4">{t('New Match', 'नया मिलान')}</h2>
                <label className="block text-xs text-ivory/55 mb-4">
                  {t('Boy / Var Kundli', 'वर कुंडली')}
                  <select className="input-royal mt-1" value={form.boy_kundli_id} onChange={(e) => setForm((f) => ({ ...f, boy_kundli_id: e.target.value }))} required>
                    <option value="">{t('Select', 'चुनें')}</option>
                    {profiles.map((profile) => <option key={profile.uuid} value={profile.uuid}>{profile.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs text-ivory/55 mb-5">
                  {t('Girl / Vadhu Kundli', 'वधू कुंडली')}
                  <select className="input-royal mt-1" value={form.girl_kundli_id} onChange={(e) => setForm((f) => ({ ...f, girl_kundli_id: e.target.value }))} required>
                    <option value="">{t('Select', 'चुनें')}</option>
                    {profiles.map((profile) => <option key={profile.uuid} value={profile.uuid}>{profile.name}</option>)}
                  </select>
                </label>
                <button disabled={busy || form.boy_kundli_id === form.girl_kundli_id} className="btn-gold w-full text-sm px-5 py-2">
                  {busy ? t('Calculating…', 'गणना हो रही है…') : t('Calculate Match', 'मिलान करें')}
                </button>
              </form>

              <div className="card-royal p-5">
                <h2 className="font-serif text-gold text-xl mb-4">{t('Match History', 'मिलान इतिहास')}</h2>
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-ivory/45 text-sm">{t('No matches yet. Calculate your first match above.', 'अभी कोई मिलान नहीं। ऊपर से पहला मिलान करें।')}</p>
                  ) : requests.map((request) => {
                    const score = request.result?.total;
                    const color = score >= 32 ? '#10B981' : score >= 25 ? '#22C55E' : score >= 18 ? '#F59E0B' : '#EF4444';
                    return (
                      <button key={request.uuid} onClick={() => setLatest(request)} className="w-full text-left border border-gold/10 rounded p-3 hover:border-gold/35 transition-colors">
                        <div className="flex justify-between gap-3 items-center">
                          <span className="text-ivory text-sm">{request.boy_name} ↔ {request.girl_name}</span>
                          <span className="text-xs font-bold" style={{ color }}>{score ?? '--'}/36</span>
                        </div>
                        <p className="text-ivory/35 text-[10px] mt-1">
                          {String(request.created_at || '').slice(0, 10)} · {request.result?.verdict_en || request.result?.verdict || request.status}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {latest?.result ? (
                <>
                  <ResultPanel result={latest.result} lang={lang} />
                  <div className="flex justify-end">
                    <button onClick={() => downloadMatchPdf(latest)} className="btn-outline-gold text-xs px-4 py-2">Export PDF</button>
                  </div>
                </>
              ) : (
                <div className="card-royal p-10 text-center text-ivory/45">
                  {t('Select a saved match from the history or calculate a new one above.', 'इतिहास से कोई मिलान चुनें या ऊपर नया मिलान करें।')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
