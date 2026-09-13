'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Loader2, Globe, Clock, Building } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    school_name: 'SMP Negeri 1',
    school_logo: '',
    timezone: 'Asia/Makassar',
    default_start_time: '07:00',
    default_late_time: '07:30',
    default_end_time: '08:30',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setMsg('Pengaturan sekolah berhasil diperbarui.');
      } else {
        setMsg(data.error?.message || 'Gagal memperbarui pengaturan.');
      }
    } catch (err) {
      setMsg('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Pengaturan Sistem & Sekolah</h1>
        <p className="text-sm text-slate-400 mt-0.5">Konfigurasi nama sekolah, zona waktu, dan jadwal absensi default</p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
        <div className="space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Informasi Identitas Sekolah</span>
          </h3>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Sekolah *</label>
            <input
              type="text"
              value={settings.school_name}
              onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">URL Logo Sekolah (Opsional)</label>
            <input
              type="text"
              value={settings.school_logo || ''}
              onChange={(e) => setSettings({ ...settings, school_logo: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Zona Waktu Server</span>
          </h3>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Pilih Zona Waktu (Timezone) *</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB UTC+7)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA UTC+8)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT UTC+9)</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Konfigurasi Waktu Absensi Default</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jam Mulai Sesi</label>
              <input
                type="text"
                value={settings.default_start_time}
                onChange={(e) => setSettings({ ...settings, default_start_time: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Batas Keterlambatan</label>
              <input
                type="text"
                value={settings.default_late_time}
                onChange={(e) => setSettings({ ...settings, default_late_time: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-mono text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Jam Selesai (Tutup)</label>
              <input
                type="text"
                value={settings.default_end_time}
                onChange={(e) => setSettings({ ...settings, default_end_time: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-rose-400 font-mono text-center font-bold"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
