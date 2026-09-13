'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, Lock, Unlock, Calendar, X, Loader2, AlertTriangle } from 'lucide-react';

export default function AttendanceSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Absensi Pagi',
    date: new Date().toISOString().split('T')[0],
    start_time: '07:00',
    late_after: '07:30',
    end_time: '08:30',
    status: 'open',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Gagal membuat sesi absensi.');
        setSubmitLoading(false);
        return;
      }

      setShowAddModal(false);
      fetchSessions();
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleSessionStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Kelola Sesi Absensi</h1>
          <p className="text-sm text-slate-400 mt-0.5">Konfigurasi jadwal jam masuk, batas keterlambatan, dan status sesi</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: 'Absensi Pagi',
              date: new Date().toISOString().split('T')[0],
              start_time: '07:00',
              late_after: '07:30',
              end_time: '08:30',
              status: 'open',
            });
            setFormError('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Sesi Absensi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {s.status === 'open' ? 'SEKAB TERBUKA' : 'DITUTUP'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{s.date}</span>
              </div>

              <h3 className="font-extrabold text-lg text-white mt-3">{s.name}</h3>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Jam Mulai:</span>
                  <span className="font-mono text-white font-semibold">{s.start_time}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Batas Terlambat:</span>
                  <span className="font-mono text-amber-400 font-semibold">{s.late_after}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-800/50">
                  <span className="text-slate-400">Jam Selesai (Tutup):</span>
                  <span className="font-mono text-rose-400 font-semibold">{s.end_time}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total Absen: <strong className="text-white font-mono">{s._count?.attendances ?? 0}</strong>
              </span>

              <button
                onClick={() => toggleSessionStatus(s.id, s.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  s.status === 'open'
                    ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30'
                    : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                }`}
              >
                {s.status === 'open' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Tutup Sesi
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Buka Sesi
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Buat Sesi Absensi Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Sesi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tanggal Absensi *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jam Mulai</label>
                  <input
                    type="text"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Terlambat</label>
                  <input
                    type="text"
                    value={formData.late_after}
                    onChange={(e) => setFormData({ ...formData, late_after: e.target.value })}
                    required
                    className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-400 font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-rose-400 font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
