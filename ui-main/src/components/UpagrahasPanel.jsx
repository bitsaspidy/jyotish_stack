'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import adminApi from '../lib/adminApi';

const GOLD   = '#D4AF37';
const AMBER  = '#F59E0B';
const MUTED  = 'rgba(245,240,232,0.55)';
const IVORY  = '#EFE9D8';
const RED    = '#EF4444';
const GREEN  = '#22C55E';

const NATURE_ICON = { dhuma:'💨', vyatipata:'⚡', parivesha:'🌟', indrachapa:'🌈', upaketu:'☄️' };
const NATURE_COLOR = (u) => u.is_malefic ? RED : GREEN;

function UpagrahaCard({ u, lang, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const hi = lang === 'hi';
  // Regional DB langs (seed 029): regional column with EN fallback; EN/HI keep
  // their original hi→en fallback. rashi_* has no regional column, so regional
  // langs read the English sign name.
  const reg = ['ta','te','bn','mr','pa','gu'].includes(lang);
  const pick = (base) => reg ? (u[`${base}_${lang}`] || u[`${base}_en`]) : (hi ? (u[`${base}_hi`] || u[`${base}_en`]) : u[`${base}_en`]);

  const name       = pick('name');
  const meaning    = pick('literal_meaning');
  const nature     = pick('nature');
  const sign       = hi ? (u.rashi_hi || u.rashi_en) : u.rashi_en;
  const hEffect    = pick('house_effect');
  const positive   = pick('positive_traits');
  const negative   = pick('negative_traits');
  const spiritual  = pick('spiritual');
  const keyInd     = pick('key_indication');
  const nColor     = NATURE_COLOR(u);
  const icon       = NATURE_ICON[u.slug] || '🪐';

  return (
    <div style={{
      border: `1px solid ${open ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, overflow: 'hidden', marginBottom: 10,
      background: open ? 'rgba(14,18,38,0.55)' : 'rgba(14,18,38,0.3)',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', padding: '13px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: GOLD, fontFamily: 'var(--font-devanagari),sans-serif' }}>
              {name}
              {u.name_hi && !hi && (
                <span style={{ fontWeight: 400, fontSize: 11, color: MUTED, marginLeft: 6 }}>{u.name_hi}</span>
              )}
            </span>
            <span style={{ fontSize: 10, color: MUTED, fontStyle: 'italic' }}>{meaning}</span>
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Sign + House badge */}
          <span style={{
            fontSize: 10, color: AMBER, border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
          }}>
            {sign} · {hi ? 'भाव' : 'H'}{u.house}
          </span>
          {/* Malefic / Benefic badge */}
          <span style={{
            fontSize: 9, color: nColor, border: `1px solid ${nColor}44`,
            borderRadius: 20, padding: '2px 7px',
          }}>
            {u.is_malefic ? (hi ? 'अशुभ' : 'Malefic') : (hi ? 'शुभ' : 'Benefic')}
          </span>
          <span style={{
            fontSize: 11, color: 'rgba(245,240,232,0.3)',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}>▾</span>
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Degree */}
          <p style={{ fontSize: 11, color: 'rgba(245,240,232,0.35)', margin: '10px 0 14px' }}>
            {hi ? 'स्थिति:' : 'Position:'} {sign} {u.degree_dms} &nbsp;·&nbsp;
            {hi ? 'सूत्र:' : 'Formula:'} <span style={{ color: AMBER }}>{u.formula_en}</span>
          </p>

          {/* Nature */}
          {nature && (
            <p style={{
              fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 14,
              fontFamily: 'var(--font-devanagari),sans-serif',
            }}>{nature}</p>
          )}

          {/* House effect */}
          {hEffect && (
            <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 10, color: AMBER, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {hi ? `भाव ${u.house} में प्रभाव` : `Effect in House ${u.house}`}
              </p>
              <p style={{ fontSize: 12, color: IVORY, lineHeight: 1.7, fontFamily: 'var(--font-devanagari),sans-serif' }}>
                {hEffect}
              </p>
            </div>
          )}

          {/* Conjunct planets */}
          {u.conjunct_planets?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, color: AMBER, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {hi ? 'युति-प्रभाव' : 'Conjunct Planet Effects'}
              </p>
              {u.conjunct_planets.map(cp => {
                const cEff = reg ? (cp[`effect_${lang}`] || cp.effect_en) : (hi ? (cp.effect_hi || cp.effect_en) : cp.effect_en);
                if (!cEff) return null;
                return (
                  <div key={cp.planet} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '7px 10px', background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, minWidth: 60 }}>{cp.planet}</span>
                    <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, fontFamily: 'var(--font-devanagari),sans-serif' }}>{cEff}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Positive / Negative */}
          <div className="responsive-two-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {positive && (
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: GREEN, fontWeight: 700, marginBottom: 6 }}>
                  {hi ? 'सकारात्मक' : 'Positive'}
                </p>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, fontFamily: 'var(--font-devanagari),sans-serif' }}>{positive}</p>
              </div>
            )}
            {negative && (
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: RED, fontWeight: 700, marginBottom: 6 }}>
                  {hi ? 'नकारात्मक' : 'Negative'}
                </p>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, fontFamily: 'var(--font-devanagari),sans-serif' }}>{negative}</p>
              </div>
            )}
          </div>

          {/* Spiritual + Key Indication */}
          {spiritual && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: AMBER, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                {hi ? 'आध्यात्मिक महत्त्व' : 'Spiritual Significance'}
              </p>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, fontFamily: 'var(--font-devanagari),sans-serif' }}>{spiritual}</p>
            </div>
          )}
          {keyInd && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderLeft: '3px solid rgba(245,158,11,0.45)', borderRadius: '0 6px 6px 0' }}>
              <p style={{ fontSize: 11, color: AMBER, lineHeight: 1.6, fontFamily: 'var(--font-devanagari),sans-serif' }}>{keyInd}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UpagrahasPanel({ uuid, lang = 'en', admin = false }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const hi = lang === 'hi';

  useEffect(() => {
    if (!uuid) return;
    const req = admin
      ? adminApi.get(`/admin/kundlis/${uuid}/upagrahas`)
      : api.get(`/kundli/${uuid}/upagrahas`);
    req
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uuid, admin]);

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
      {hi ? 'उपग्रह गणना हो रही है…' : 'Computing upagrahas…'}
    </div>
  );
  if (!data?.upagrahas?.length) return (
    <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
      {hi ? 'उपग्रह डेटा उपलब्ध नहीं।' : 'Upagraha data not available.'}
    </div>
  );

  return (
    <div style={{ marginTop: 8 }}>
      {/* Intro card */}
      <div style={{
        background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 18,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 6, fontFamily: 'var(--font-devanagari),sans-serif' }}>
          🪐 {hi ? 'सूर्याश्रित उपग्रह' : 'Sun-Based Upagrahas (Shadow Planets)'}
        </p>
        <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, fontFamily: 'var(--font-devanagari),sans-serif' }}>
          {hi
            ? 'उपग्रह गणितीय बिंदु हैं जो सूर्य की स्पष्ट कला से व्युत्पन्न होते हैं। ये भावों व ग्रहों के फलों को परिवर्तित और तीव्र करते हैं — छिपे कष्ट, आकस्मिक घटनाएँ, यश, क्षणिक भाग्य एवं वैराग्य के संकेत देते हैं। (स्रोत: बृहत्पाराशर होरा शास्त्र)'
            : 'Upagrahas are mathematical sensitive points derived from the Sun\'s longitude. They modify and intensify house and planetary results — indicating hidden afflictions, sudden events, fame, transient luck, and detachment. (Source: BPHS / Parashari Jyotish)'}
        </p>
      </div>

      {/* 5 Cards */}
      {data.upagrahas.map((u) => (
        <UpagrahaCard key={u.slug} u={u} lang={lang} />
      ))}
    </div>
  );
}
