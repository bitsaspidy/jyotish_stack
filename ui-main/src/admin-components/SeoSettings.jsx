'use client';

import { useEffect, useMemo, useState } from 'react';
import adminApi from '../lib/adminApi';
import toast from 'react-hot-toast';
import { SITEMAP_ROUTES, BLOG_POSTS_ROUTE, ROUTE_GROUPS, CHANGE_FREQUENCIES, resolveRoutes, resolveBlogRoute } from '../lib/seoRoutes';

/**
 * Admin → Settings → 🔍 SEO.
 *
 * Talks to /admin/seo (not the generic /admin/settings PATCH) because the sitemap
 * overrides are structured JSON that needs validating server-side.
 *
 * The route table is rendered from lib/seoRoutes.js — the SAME catalogue the
 * sitemap generates from. Only the differences the admin makes are saved, so a
 * page added in code shows up here automatically and an untouched route keeps
 * following its code default rather than freezing today's value into the DB.
 */

const GOLD = '#D4AF37';
const IVORY = 'rgba(245,240,232,0.92)';
const DIM = 'rgba(245,240,232,0.45)';

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(212,175,55,0.18)', color: IVORY, fontSize: 13, outline: 'none',
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', color: IVORY, fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ color: DIM, fontSize: 11, lineHeight: 1.7, marginTop: 6 }}>{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange} style={{
      width: 38, height: 21, borderRadius: 11, background: checked ? GOLD : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, width: 17, height: 17, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', left: checked ? 19 : 2,
      }} />
    </button>
  );
}

export default function SeoSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [ga, setGa] = useState('');
  const [gsc, setGsc] = useState('');
  const [method, setMethod] = useState('none');
  const [txtToken, setTxtToken] = useState('');
  const [overrides, setOverrides] = useState({});
  const [siteUrl, setSiteUrl] = useState('');
  const [gscUrl, setGscUrl] = useState(null);
  const [dnsResult, setDnsResult] = useState(null);
  const [dnsChecking, setDnsChecking] = useState(false);

  useEffect(() => {
    adminApi.get('/admin/seo')
      .then(({ data }) => {
        setGa(data.settings?.gaMeasurementId || '');
        setGsc(data.settings?.gscFile || '');
        setMethod(data.settings?.gscMethod || 'none');
        setTxtToken(data.settings?.gscTxtToken || '');
        setOverrides(data.settings?.sitemapOverrides || {});
        setSiteUrl(data.siteUrl || '');
        setGscUrl(data.gscUrl || null);
      })
      .catch(() => toast.error('Failed to load SEO settings'))
      .finally(() => setLoading(false));
  }, []);

  const checkDns = async () => {
    setDnsChecking(true);
    setDnsResult(null);
    try {
      const { data } = await adminApi.get('/admin/seo/verify-dns');
      setDnsResult(data.dns);
    } catch {
      toast.error('DNS check failed');
    } finally { setDnsChecking(false); }
  };

  const routes = useMemo(() => resolveRoutes(overrides), [overrides]);
  const blogRoute = useMemo(() => resolveBlogRoute(overrides), [overrides]);
  const allRows = useMemo(() => [...routes, blogRoute], [routes, blogRoute]);
  const enabledCount = allRows.filter((r) => r.enabled).length;

  /**
   * Store only what actually differs from the code default. Writing every field
   * for every route would freeze today's defaults into the database and silently
   * ignore any future change made in code.
   */
  const setOverride = (route, patch) => {
    setOverrides((prev) => {
      const base = SITEMAP_ROUTES.find((r) => r.path === route.path) || BLOG_POSTS_ROUTE;
      const merged = { ...(prev[route.path] || {}), ...patch };
      if (merged.enabled === true) delete merged.enabled;             // enabled is the default
      if (Number(merged.priority) === base.priority) delete merged.priority;
      if (merged.changeFrequency === base.changeFrequency) delete merged.changeFrequency;
      const next = { ...prev };
      if (Object.keys(merged).length === 0) delete next[route.path];
      else next[route.path] = merged;
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await adminApi.put('/admin/seo', {
        gaMeasurementId: ga.trim(),
        gscMethod: method,
        gscFile: gsc.trim(),
        gscTxtToken: txtToken.trim(),
        sitemapOverrides: overrides,
      });
      setGa(data.settings?.gaMeasurementId || '');
      setGsc(data.settings?.gscFile || '');
      setMethod(data.settings?.gscMethod || 'none');
      setTxtToken(data.settings?.gscTxtToken || '');
      setOverrides(data.settings?.sitemapOverrides || {});
      setGscUrl(data.gscUrl || null);
      setDirty(false);
      toast.success('SEO settings saved');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save SEO settings');
    } finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: DIM, fontSize: 13, padding: '24px 0' }}>Loading SEO settings…</p>;

  const grouped = Object.keys(ROUTE_GROUPS).map((g) => ({
    key: g,
    label: ROUTE_GROUPS[g],
    rows: allRows.filter((r) => r.group === g),
  })).filter((g) => g.rows.length);

  return (
    <div>
      {/* ── Google Analytics ─────────────────────────────────────────────── */}
      <section style={{ border: '1px solid rgba(212,175,55,0.14)', borderRadius: 12, padding: '18px 20px', marginBottom: 18, background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ color: GOLD, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📊 Google Analytics</h3>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7, marginBottom: 14 }}>
          Takes effect immediately — no rebuild or deploy needed. Visitors pick it up on their next page load.
        </p>
        <Field
          label="GA4 Measurement ID"
          hint={<>Find it in Google Analytics → Admin → Data Streams → your web stream. Looks like <code style={{ color: GOLD }}>G-XXXXXXXXXX</code>. Leave empty to switch analytics off completely. Universal Analytics (<code>UA-</code>) IDs no longer work — Google shut that product down in 2023.</>}
        >
          <input value={ga} onChange={(e) => { setGa(e.target.value); setDirty(true); }} placeholder="G-XXXXXXXXXX" style={inputStyle} />
        </Field>
        <div style={{ fontSize: 11.5, color: ga ? '#22C55E' : DIM }}>
          {ga ? '● Analytics will load for all visitors' : '○ Analytics is off'}
        </div>
      </section>

      {/* ── Search Console ───────────────────────────────────────────────── */}
      <section style={{ border: '1px solid rgba(212,175,55,0.14)', borderRadius: 12, padding: '18px 20px', marginBottom: 18, background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ color: GOLD, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🔎 Google Search Console</h3>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7, marginBottom: 14 }}>
          Record how this site proves ownership to Google, so the method is written down rather than remembered.
        </p>

        <Field label="Verification method">
          <select value={method} onChange={(e) => { setMethod(e.target.value); setDirty(true); }} style={inputStyle}>
            <option value="none" style={{ background: '#111428' }}>Not verified / not recorded</option>
            <option value="dns_txt" style={{ background: '#111428' }}>DNS TXT record (domain property)</option>
            <option value="html_file" style={{ background: '#111428' }}>HTML file served by this site</option>
          </select>
        </Field>

        {/* ── DNS TXT ─────────────────────────────────────────────────────── */}
        {method === 'dns_txt' && (
          <>
            <div style={{ border: '1px solid rgba(96,165,250,0.28)', background: 'rgba(96,165,250,0.06)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
              <p style={{ color: '#93C5FD', fontSize: 11.5, lineHeight: 1.75 }}>
                <strong>This site serves nothing for DNS verification.</strong> The record lives at your DNS provider, and Google checks it there.
                Verification is already done — there is nothing to deploy. A domain property also covers every subdomain, which is why it is the strongest method.
              </p>
            </div>
            <Field
              label="TXT token (for reference and monitoring)"
              hint={<>Paste the whole record or just the token — both work. Storing it lets the check below tell you whether the record is still live. A TXT record dropped during a DNS change un-verifies the site silently, and nothing else here would notice.</>}
            >
              <input value={txtToken} onChange={(e) => { setTxtToken(e.target.value); setDirty(true); }}
                placeholder="google-site-verification=…" style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={checkDns} disabled={dnsChecking} style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)',
                color: '#93C5FD', cursor: dnsChecking ? 'default' : 'pointer',
              }}>
                {dnsChecking ? 'Checking DNS…' : '🔄 Check DNS now'}
              </button>
              {dirty && <span style={{ color: DIM, fontSize: 11 }}>Save first — the check reads the stored token.</span>}
            </div>

            {dnsResult && (
              <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.85 }}>
                {!dnsResult.ok ? (
                  <div style={{ color: '#F59E0B' }}>⚠ {dnsResult.error} — this means the lookup itself failed, not necessarily that the record is gone.</div>
                ) : dnsResult.matches ? (
                  <div style={{ color: '#22C55E' }}>
                    ✓ The stored token is live in DNS for <strong>{dnsResult.domain}</strong>.
                    <div style={{ color: DIM }}>Answered by {dnsResult.resolver}. Google can verify this domain.</div>
                  </div>
                ) : dnsResult.present ? (
                  <div style={{ color: '#F59E0B' }}>
                    ⚠ A google-site-verification record exists, but it does not match the token saved here.
                    <div style={{ color: DIM, wordBreak: 'break-all' }}>
                      Live: {dnsResult.found.join(', ')}<br />
                      {dnsResult.expected ? <>Saved: {dnsResult.expected}</> : 'No token saved here yet — save the live value above to monitor it.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#EF4444' }}>
                    ✗ No google-site-verification TXT record found for <strong>{dnsResult.domain}</strong>.
                    <div style={{ color: DIM }}>If Search Console previously showed this domain as verified, the record may have been removed — Google will drop the verification.</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── HTML file ───────────────────────────────────────────────────── */}
        {method === 'html_file' && (
          <>
            <Field
              label="Verification filename"
              hint={<>In Search Console choose <strong style={{ color: IVORY }}>HTML file</strong>, then paste the filename it gives you — e.g. <code style={{ color: GOLD }}>google1a2b3c4d5e6f7890.html</code>. Nothing needs uploading; the file is served from this setting. Save it here first, then press Verify in Search Console.</>}
            >
              <input value={gsc} onChange={(e) => { setGsc(e.target.value); setDirty(true); }} placeholder="google1a2b3c4d5e6f7890.html" style={inputStyle} />
            </Field>
            {gscUrl ? (
              <div style={{ fontSize: 11.5, color: '#22C55E', lineHeight: 1.8 }}>
                ● Serving at <a href={gscUrl} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'underline' }}>{gscUrl}</a>
                <div style={{ color: DIM }}>Open that link to confirm Google will find it before pressing Verify.</div>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: DIM }}>○ No verification file is being served</div>
            )}
          </>
        )}

        {method === 'none' && (
          <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.75 }}>
            Pick the method you used in Search Console. If you verified with a DNS TXT record, choose that — it is already done and needs nothing from this site.
          </p>
        )}
      </section>

      {/* ── Sitemap ──────────────────────────────────────────────────────── */}
      <section style={{ border: '1px solid rgba(212,175,55,0.14)', borderRadius: 12, padding: '18px 20px', marginBottom: 18, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
          <h3 style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>🗺️ Sitemap</h3>
          <span style={{ color: DIM, fontSize: 11.5 }}>
            {enabledCount}/{allRows.length} listed ·{' '}
            {siteUrl && <a href={`${siteUrl}/sitemap.xml`} target="_blank" rel="noreferrer" style={{ color: GOLD, textDecoration: 'underline' }}>view sitemap.xml</a>}
          </span>
        </div>
        <p style={{ color: DIM, fontSize: 11.5, lineHeight: 1.7, marginBottom: 14 }}>
          Turn a page off to drop it from sitemap.xml. The page stays live and reachable — this only tells Google what to prioritise crawling.
          Pages added in code appear here on their own. The sitemap is cached for up to an hour, so changes are not instant.
        </p>

        {grouped.map((g) => (
          <div key={g.key} style={{ marginBottom: 14 }}>
            <h4 style={{ color: IVORY, fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.75 }}>{g.label}</h4>
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
              {g.rows.map((r, i) => (
                <div key={r.path} style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center',
                  padding: '8px 11px', background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent',
                  opacity: r.enabled ? 1 : 0.45,
                }}>
                  <Toggle checked={r.enabled} onChange={() => setOverride(r, { enabled: !r.enabled })} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: IVORY, fontSize: 12, fontWeight: 600 }}>
                      {r.label}
                      {r.overridden && <span style={{ color: GOLD, fontSize: 9.5, marginLeft: 6 }}>● customised</span>}
                    </div>
                    <div style={{ color: DIM, fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.path}</div>
                  </div>
                  <select
                    value={r.changeFrequency}
                    onChange={(e) => setOverride(r, { changeFrequency: e.target.value })}
                    disabled={!r.enabled}
                    style={{ ...inputStyle, width: 'auto', padding: '4px 7px', fontSize: 11 }}
                  >
                    {CHANGE_FREQUENCIES.map((f) => <option key={f} value={f} style={{ background: '#111428' }}>{f}</option>)}
                  </select>
                  <input
                    type="number" min="0" max="1" step="0.05"
                    value={r.priority}
                    onChange={(e) => setOverride(r, { priority: e.target.value })}
                    disabled={!r.enabled}
                    style={{ ...inputStyle, width: 66, padding: '4px 7px', fontSize: 11 }}
                    title="Crawl priority 0.0–1.0"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={save} disabled={saving || !dirty} style={{
          padding: '9px 22px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 700,
          cursor: saving || !dirty ? 'default' : 'pointer',
          background: dirty ? GOLD : 'rgba(255,255,255,0.08)',
          color: dirty ? '#0B0D1A' : DIM,
        }}>
          {saving ? 'Saving…' : 'Save SEO settings'}
        </button>
        {dirty && <span style={{ color: DIM, fontSize: 11.5 }}>Unsaved changes</span>}
      </div>
    </div>
  );
}
