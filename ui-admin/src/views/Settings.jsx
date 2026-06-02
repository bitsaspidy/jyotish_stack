'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setSettings(data.settings)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));
  const toggle = (key) => set(key, settings[key] === 'true' ? 'false' : 'true');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gold mb-6">App Settings</h1>
      <div className="space-y-6">

        {/* Maintenance */}
        <div className="admin-card">
          <h2 className="text-gold font-semibold mb-4">🚧 Maintenance / Coming Soon</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-ivory text-sm font-medium">Maintenance Mode</p>
              <p className="text-ivory/50 text-xs mt-0.5">Visitors see Coming Soon page. Admin routes stay accessible.</p>
            </div>
            <Toggle checked={settings.maintenance_mode === 'true'} onChange={() => toggle('maintenance_mode')} />
          </div>
          <div className="space-y-3">
            {[
              ['maintenance_title', 'Page Title', false],
              ['maintenance_message', 'Message (English)', true],
              ['maintenance_message_hi', 'Message (Hindi)', true],
            ].map(([key, label, isTextarea]) => (
              <div key={key}>
                <label className="text-ivory/60 text-xs block mb-1">{label}</label>
                {isTextarea
                  ? <textarea className="admin-input h-20 resize-none" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
                  : <input className="admin-input" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
                }
              </div>
            ))}
          </div>
        </div>

        {/* Site Info */}
        <div className="admin-card">
          <h2 className="text-gold font-semibold mb-4">🌐 Site Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['site_name', 'Site Name'],
              ['site_tagline', 'Tagline (English)'],
              ['site_tagline_hi', 'Tagline (Hindi)'],
              ['contact_email', 'Contact Email'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-ivory/60 text-xs block mb-1">{label}</label>
                <input className="admin-input" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className="admin-card">
          <h2 className="text-gold font-semibold mb-4">💳 Payments</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ivory text-sm font-medium">Razorpay Enabled</p>
              <p className="text-ivory/50 text-xs">Enable payment gateway for subscriptions</p>
            </div>
            <Toggle checked={settings.razorpay_enabled === 'true'} onChange={() => toggle('razorpay_enabled')} />
          </div>
        </div>

        <button onClick={save} disabled={saving} className="admin-btn px-8 py-3">
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
