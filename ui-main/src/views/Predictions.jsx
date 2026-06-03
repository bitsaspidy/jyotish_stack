'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StarField from '../components/StarField';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import api from '../lib/api';

function parseChart(profile) {
  if (!profile?.calculated_data) return null;
  if (typeof profile.calculated_data === 'object') return profile.calculated_data;
  try { return JSON.parse(profile.calculated_data); } catch { return null; }
}

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

export default function Predictions() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [selectedUuid, setSelectedUuid] = useState('');
  const [fetching, setFetching] = useState(true);

  const t = (en, hi) => (lang === 'hi' ? hi : en);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setFetching(true);
      try {
        const { data } = await api.get('/kundli');
        const baseProfiles = data.profiles || [];
        const detailed = await Promise.all(baseProfiles.map(async (profile) => {
          try {
            const detail = await api.get(`/kundli/${profile.uuid}`);
            return detail.data.profile;
          } catch {
            return profile;
          }
        }));
        setProfiles(detailed);
        setSelectedUuid((current) => current || detailed[0]?.uuid || '');
      } catch (e) {
        toast.error(e.response?.data?.message || 'Unable to load predictions');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user]);

  const selected = useMemo(
    () => profiles.find((profile) => profile.uuid === selectedUuid) || profiles[0],
    [profiles, selectedUuid]
  );
  const chart = parseChart(selected);
  const currentDasha = chart?.dasha?.find((period) => period.is_current) || chart?.dasha?.[0];
  const currentAntar = currentDasha?.antardasha?.find((period) => period.is_current) || currentDasha?.antardasha?.[0];
  const categories = chart?.predictions?.categories || {};

  const downloadPdf = async () => {
    if (!selected) return;
    try {
      const response = await api.get(`/kundli/${selected.uuid}/report.pdf`, { responseType: 'blob' });
      downloadBlob(new Blob([response.data], { type: 'application/pdf' }), `${selected.name || 'kundli'}-predictions.pdf`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Unable to export PDF');
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gold">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen pt-24 px-5 pb-20">
      <StarField count={70} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-gold/50 text-xs uppercase tracking-[0.35em]">Bhavishya Vani</p>
            <h1 className="font-serif text-3xl md:text-4xl text-gradient-gold font-bold mt-2">
              {t('Predictions', 'Bhavishya Vani')}
            </h1>
            <p className="text-ivory/55 text-sm mt-2 max-w-2xl">
              {t('Rule-based dasha, gochar, and dosha insights generated from the calculated Kundli.', 'Calculated Kundli se dasha, gochar aur dosha based insights.')}
            </p>
          </div>
          {selected && <button onClick={downloadPdf} className="btn-outline-gold text-xs px-4 py-2">Export PDF</button>}
        </div>

        {fetching ? (
          <div className="card-royal p-8 text-center text-ivory/45">Loading predictions...</div>
        ) : profiles.length === 0 ? (
          <div className="card-royal p-10 text-center">
            <h2 className="font-serif text-gold text-2xl mb-2">{t('Create a Kundli first', 'Pehle Kundli banao')}</h2>
            <p className="text-ivory/55 text-sm mb-5">{t('Predictions are generated from your birth chart data.', 'Predictions birth chart data se generate hote hain.')}</p>
            <Link href="/kundli/new" className="btn-gold text-sm px-5 py-2">{t('Create Kundli', 'Kundli banao')}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-1 card-royal p-4 h-fit">
              <h2 className="font-serif text-gold text-lg mb-3">{t('Profiles', 'Profiles')}</h2>
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <button key={profile.uuid} onClick={() => setSelectedUuid(profile.uuid)}
                    className={`w-full text-left rounded border p-3 transition-colors ${profile.uuid === selected?.uuid ? 'border-gold/45 bg-gold/10' : 'border-gold/10 hover:border-gold/30'}`}>
                    <p className="text-sm text-ivory">{profile.name}</p>
                    <p className="text-[10px] text-ivory/35 mt-1">{String(profile.date_of_birth).slice(0, 10)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-5">
              {!chart ? (
                <div className="card-royal p-8 text-center">
                  <p className="text-ivory/55 text-sm mb-4">{t('Calculation is pending for this Kundli.', 'Is Kundli ki calculation pending hai.')}</p>
                  <Link href={`/kundli/${selected.uuid}`} className="btn-gold text-sm px-5 py-2">{t('Open Kundli', 'Kundli kholo')}</Link>
                </div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-royal p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="font-serif text-2xl text-gold">{selected.name}</h2>
                        <p className="text-ivory/45 text-sm mt-1">{chart.ascendant.rashi_en} Lagna | Moon in {chart.planets.Moon.rashi_en} | {chart.nakshatra.en} Pada {chart.nakshatra.pada}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-white/5 rounded px-4 py-3">
                          <p className="text-[10px] text-ivory/35 uppercase">Mahadasha</p>
                          <p className="text-gold text-sm mt-1">{currentDasha?.lord || 'N/A'}</p>
                        </div>
                        <div className="bg-white/5 rounded px-4 py-3">
                          <p className="text-[10px] text-ivory/35 uppercase">Antardasha</p>
                          <p className="text-gold text-sm mt-1">{currentAntar?.lord || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-royal p-5">
                    <h2 className="font-serif text-gold text-xl mb-4">{t('Today and Current Period', 'Aaj aur vartaman avadhi')}</h2>
                    <div className="space-y-3">
                      {chart.predictions?.summary_en?.map((line, index) => (
                        <div key={index} className="border border-gold/10 rounded p-3 text-sm text-ivory/75">
                          {line}
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(categories).filter(([key]) => key !== 'remedies').map(([key, value]) => (
                      <div key={key} className="card-royal p-5">
                        <p className="text-[10px] text-gold/60 uppercase tracking-[0.25em]">{key}</p>
                        <p className="text-ivory/75 text-sm mt-3">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card-royal p-5">
                      <p className="text-[10px] text-ivory/35 uppercase tracking-widest">Sade Sati</p>
                      <p className="text-lg text-gold mt-2">{chart.gochar?.highlights?.sade_sati?.active ? chart.gochar.highlights.sade_sati.phase : 'Inactive'}</p>
                    </div>
                    <div className="card-royal p-5">
                      <p className="text-[10px] text-ivory/35 uppercase tracking-widest">Jupiter</p>
                      <p className="text-lg text-gold mt-2">{chart.gochar?.highlights?.jupiter_support?.favorable ? 'Supportive' : 'Patient'}</p>
                    </div>
                    <div className="card-royal p-5">
                      <p className="text-[10px] text-ivory/35 uppercase tracking-widest">Rahu Ketu</p>
                      <p className="text-lg text-gold mt-2">{chart.gochar?.highlights?.rahu_ketu_axis || 'N/A'}</p>
                    </div>
                  </div>

                  {Array.isArray(categories.remedies) && (
                    <div className="card-royal p-5">
                      <h2 className="font-serif text-gold text-xl mb-4">{t('Suggested Remedies', 'Upay')}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {categories.remedies.map((remedy) => (
                          <div key={remedy} className="border border-gold/10 rounded p-3 text-sm text-ivory/70">{remedy}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
