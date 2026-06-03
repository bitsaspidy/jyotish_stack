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

function ScoreBadge({ result }) {
  if (!result) return null;
  const color = result.total >= 28 ? '#22c55e' : result.total >= 22 ? '#D4AF37' : result.total >= 18 ? '#F59E0B' : '#EF4444';
  return (
    <div className="text-center">
      <div className="w-28 h-28 rounded-full border flex items-center justify-center mx-auto" style={{ borderColor: color, background: `${color}18` }}>
        <div>
          <p className="text-3xl font-bold" style={{ color }}>{result.total}</p>
          <p className="text-xs text-ivory/40">/ 36</p>
        </div>
      </div>
      <p className="text-xs uppercase tracking-[0.2em] mt-3" style={{ color }}>{result.verdict}</p>
    </div>
  );
}

function ResultPanel({ result }) {
  if (!result) return null;
  return (
    <div className="card-royal p-5">
      <div className="grid grid-cols-1 lg:grid-cols-[150px_1fr] gap-5">
        <ScoreBadge result={result} />
        <div>
          <h2 className="font-serif text-xl text-gold mb-2">Ashtakoot Guna Milan</h2>
          <p className="text-ivory/55 text-sm mb-4">{result.summary_en}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.kootas?.map((koota) => (
              <div key={koota.name} className="bg-white/5 rounded p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ivory/80">{koota.name}</span>
                  <span className="text-gold">{koota.score}/{koota.max}</span>
                </div>
                <div className="h-1.5 bg-black/30 rounded overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: `${Math.min(100, (koota.score / koota.max) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-ivory/35 mt-1">{koota.details}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="border border-gold/10 rounded p-3">
              <p className="text-[10px] text-ivory/35 uppercase tracking-widest">Boy Mangal</p>
              <p className="text-sm text-ivory mt-1">{result.mangal?.boy?.severity || 'N/A'}</p>
            </div>
            <div className="border border-gold/10 rounded p-3">
              <p className="text-[10px] text-ivory/35 uppercase tracking-widest">Girl Mangal</p>
              <p className="text-sm text-ivory mt-1">{result.mangal?.girl?.severity || 'N/A'}</p>
            </div>
          </div>
          <p className="text-[11px] text-ivory/35 mt-4">{result.note}</p>
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
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-gold/50 text-xs uppercase tracking-[0.35em]">Compatibility</p>
          <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold mt-2">
            {t('Kundli Matchmaking', 'Kundli Milan')}
          </h1>
          <p className="text-ivory/55 text-sm mt-2 max-w-2xl">
            {t('Run Ashtakoot, Mangal Dosha comparison, score history, and export match reports.', 'Ashtakoot, Mangal Dosha, score history aur report export.')}
          </p>
        </div>

        {profiles.length < 2 ? (
          <div className="card-royal p-10 text-center">
            <h2 className="font-serif text-gold text-2xl mb-2">{t('Two Kundlis required', 'Do Kundli chahiye')}</h2>
            <p className="text-ivory/55 text-sm mb-5">{t('Create at least two profiles before running matchmaking.', 'Milan ke liye kam se kam do profiles banao.')}</p>
            <Link href="/kundli/new" className="btn-gold text-sm px-5 py-2">{t('Create Kundli', 'Kundli banao')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 space-y-5">
              <form onSubmit={submit} className="card-royal p-5">
                <h2 className="font-serif text-gold text-xl mb-4">{t('New Match', 'Naya Milan')}</h2>
                <label className="block text-xs text-ivory/55 mb-4">
                  {t('Boy Kundli', 'Boy Kundli')}
                  <select className="input-royal mt-1" value={form.boy_kundli_id} onChange={(e) => setForm((f) => ({ ...f, boy_kundli_id: e.target.value }))} required>
                    <option value="">Select</option>
                    {profiles.map((profile) => <option key={profile.uuid} value={profile.uuid}>{profile.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs text-ivory/55 mb-5">
                  {t('Girl Kundli', 'Girl Kundli')}
                  <select className="input-royal mt-1" value={form.girl_kundli_id} onChange={(e) => setForm((f) => ({ ...f, girl_kundli_id: e.target.value }))} required>
                    <option value="">Select</option>
                    {profiles.map((profile) => <option key={profile.uuid} value={profile.uuid}>{profile.name}</option>)}
                  </select>
                </label>
                <button disabled={busy || form.boy_kundli_id === form.girl_kundli_id} className="btn-gold w-full text-sm px-5 py-2">
                  {busy ? t('Calculating...', 'Calculate ho raha hai...') : t('Calculate Match', 'Milan calculate')}
                </button>
              </form>

              <div className="card-royal p-5">
                <h2 className="font-serif text-gold text-xl mb-4">{t('History', 'History')}</h2>
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <p className="text-ivory/45 text-sm">{t('No matches yet.', 'Abhi koi match nahi.')}</p>
                  ) : requests.map((request) => (
                    <button key={request.uuid} onClick={() => setLatest(request)} className="w-full text-left border border-gold/10 rounded p-3 hover:border-gold/35 transition-colors">
                      <div className="flex justify-between gap-3">
                        <span className="text-ivory text-sm">{request.boy_name} + {request.girl_name}</span>
                        <span className="text-gold text-xs">{request.result?.total ?? '--'}/36</span>
                      </div>
                      <p className="text-ivory/35 text-[10px] mt-1">{String(request.created_at || '').slice(0, 10)} | {request.status}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {latest?.result ? (
                <>
                  <ResultPanel result={latest.result} />
                  <div className="flex justify-end">
                    <button onClick={() => downloadMatchPdf(latest)} className="btn-outline-gold text-xs px-4 py-2">Export PDF</button>
                  </div>
                </>
              ) : (
                <div className="card-royal p-10 text-center text-ivory/45">
                  {t('Select a saved match or calculate a new one.', 'Saved match chuno ya naya calculate karo.')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
