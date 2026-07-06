'use client';
import Link from 'next/link';

// Plan limits must stay in sync with server/src/routes/kundli.routes.js PLAN_PROFILE_LIMITS
export const PLAN_LIMITS = { free: 1, basic: 3, premium: 10, yearly: Infinity };

const GOLD   = '#D4AF37';
const NAVY   = '#0B0D1A';
const CARD   = '#111428';
const IVORY  = '#F5F0E8';
const DIM    = 'rgba(245,240,232,0.45)';
const VIOLET = '#A78BFA';
const BLUE   = '#60A5FA';

const PLANS = [
  {
    key: 'basic',
    label: 'Basic',
    kundlis: 3,
    price_en: '₹200/mo',
    price_hi: '₹200/माह',
    features_en: ['3 Kundli profiles', 'Full D1/D9 charts', 'Dasha & Gochar', 'Life Guidance report'],
    features_hi: ['3 कुंडली प्रोफाइल', 'पूर्ण D1/D9 चार्ट', 'दशा और गोचर', 'जीवन मार्गदर्शन रिपोर्ट'],
    color: BLUE,
    border: 'rgba(96,165,250,0.35)',
    bg: 'rgba(96,165,250,0.07)',
  },
  {
    key: 'premium',
    label: 'Premium',
    kundlis: 10,
    price_en: '₹500/mo',
    price_hi: '₹500/माह',
    features_en: ['10 Kundli profiles', 'Personalized Remedy Engine', 'AI-powered predictions', 'Priority support'],
    features_hi: ['10 कुंडली प्रोफाइल', 'व्यक्तिगत उपाय इंजन', 'AI भविष्यवाणी', 'प्राथमिकता सहायता'],
    color: GOLD,
    border: 'rgba(212,175,55,0.4)',
    bg: 'rgba(212,175,55,0.08)',
    highlight: true,
  },
  {
    key: 'yearly',
    label: 'Yearly',
    kundlis: Infinity,
    price_en: '₹4000/yr',
    price_hi: '₹4000/वर्ष',
    features_en: ['Unlimited Kundlis', 'All Premium features', 'Save 33% vs monthly', 'Early access to new tools'],
    features_hi: ['असीमित कुंडली', 'सभी Premium सुविधाएं', 'मासिक से 33% बचत', 'नए उपकरणों तक शीघ्र पहुंच'],
    color: VIOLET,
    border: 'rgba(167,139,250,0.4)',
    bg: 'rgba(167,139,250,0.07)',
  },
];

export default function UpgradeModal({ onClose, used = 0, limit = 1, plan = 'free', lang = 'hi' }) {
  const hi = lang === 'hi';

  const limitLabel = limit >= 9999 ? (hi ? 'असीमित' : 'Unlimited') : limit;
  const usedLabel  = `${used} / ${limitLabel}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', background: NAVY, border: `1px solid ${GOLD}44`,
        borderRadius: 14, padding: '28px 28px 24px', width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, color: DIM, fontSize: 13, padding: '3px 9px', cursor: 'pointer',
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <h2 style={{ color: GOLD, fontFamily: 'Georgia,serif', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            {hi ? 'कुंडली सीमा पूरी हो गई' : 'Kundli Limit Reached'}
          </h2>
          <p style={{ color: DIM, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {hi
              ? `आप ${plan.toUpperCase()} प्लान पर हैं। आपने ${usedLabel} कुंडली उपयोग की हैं।`
              : `You're on the ${plan.toUpperCase()} plan and have used ${usedLabel} kundlis.`}
          </p>
        </div>

        {/* Usage bar */}
        <div style={{ margin: '0 0 24px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', height: 6 }}>
          <div style={{
            height: '100%', borderRadius: 8,
            width: `${limit >= 9999 ? 100 : Math.min(100, (used / limit) * 100)}%`,
            background: `linear-gradient(90deg, ${GOLD}, #E8C96A)`,
          }} />
        </div>

        {/* Plan cards */}
        <div className="responsive-three-column" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {PLANS.map((p) => (
            <div key={p.key} style={{
              background: p.bg, border: `1px solid ${p.border}`,
              borderRadius: 10, padding: '14px 12px',
              outline: p.highlight ? `2px solid ${GOLD}55` : 'none',
              position: 'relative',
            }}>
              {p.highlight && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: `linear-gradient(135deg,${GOLD},#E8C96A)`,
                  color: NAVY, fontSize: 9, fontWeight: 700, padding: '2px 10px',
                  borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.06em',
                }}>
                  {hi ? 'सबसे लोकप्रिय' : 'MOST POPULAR'}
                </div>
              )}
              <p style={{ color: p.color, fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{p.label}</p>
              <p style={{ color: IVORY, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
                {hi ? p.price_hi : p.price_en}
              </p>
              <p style={{ color: DIM, fontSize: 11, margin: '0 0 10px' }}>
                {p.kundlis === Infinity
                  ? (hi ? 'असीमित कुंडली' : 'Unlimited Kundlis')
                  : `${p.kundlis} ${hi ? 'कुंडली' : 'Kundlis'}`}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {(hi ? p.features_hi : p.features_en).map((f) => (
                  <li key={f} style={{ color: DIM, fontSize: 10.5, marginBottom: 4, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: p.color }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/pricing" onClick={onClose} style={{
            display: 'inline-block', padding: '11px 30px', borderRadius: 8,
            background: `linear-gradient(135deg,${GOLD},#E8C96A)`,
            color: NAVY, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            letterSpacing: '0.03em',
          }}>
            {hi ? 'प्लान देखें →' : 'View Plans →'}
          </Link>
          <button onClick={onClose} style={{
            padding: '11px 22px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
            color: DIM, fontSize: 13, cursor: 'pointer',
          }}>
            {hi ? 'बाद में' : 'Maybe later'}
          </button>
        </div>
      </div>
    </div>
  );
}
