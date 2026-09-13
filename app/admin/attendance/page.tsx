'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Search, Filter, Calendar, Edit2, X, Loader2 } from 'lucide-react';

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [date, setDate] = useState(getTodayStr());
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('present');
  const [editTime, setEditTime] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) setClasses(data.data);
    } catch (e) {}
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        date,
        class_id: filterClass,
        status: filterStatus,
        search,
      }).toString();
      const res = await fetch(`/api/attendance?${query}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data.records);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date, filterClass, filterStatus, search]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitLoading(true);

    try {
      const res = await fetch(`/api/attendance/${selectedRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          check_in_time: editTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchAttendance();
      } else {
        alert(data.error?.message || 'Gagal mengubah data absensi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (rec: any) => {
    setSelectedRecord(rec);
    setEditStatus(rec.status);
    setEditTime(rec.check_in_time);
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat & Data Absensi</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Lihat, cari, dan kelola koreksi data absensi siswa</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Siswa / ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            {date ? (
              <button
                type="button"
                onClick={() => setDate('')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 transition-all"
                title="Tampilkan semua tanggal"
              >
                Semua
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDate(getTodayStr())}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold rounded-lg border border-blue-200 transition-all"
              >
                Hari Ini
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="present">Hadir</option>
            <option value="late">Terlambat</option>
            <option value="excused">Izin</option>
            <option value="absent">Alpa</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Nama Siswa</th>
                <th className="py-3.5 px-4">ID Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Jam Check-In</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Petugas Scan</th>
                <th className="py-3.5 px-4 text-right">Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.student?.name}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-blue-600">{r.student?.student_id}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{r.student?.class?.name}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600">{r.attendance_date}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-800">{r.check_in_time}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        r.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : r.status === 'late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : r.status === 'excused'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {r.status === 'present'
                        ? 'HADIR'
                        : r.status === 'late'
                        ? 'TERLAMBAT'
                        : r.status === 'excused'
                        ? 'IZIN'
                        : 'ALPA'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{r.scanned_by || 'System'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-all border border-slate-200"
                      title="Koreksi Absensi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data absensi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Edit Attendance */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Koreksi Absensi Siswa</h3>
                <p className="text-xs text-slate-400">{selectedRecord.student?.name} ({selectedRecord.student?.student_id})</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Kehadiran</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="present">HADIR (Present)</option>
                  <option value="late">TERLAMBAT (Late)</option>
                  <option value="excused">IZIN / SAKIT (Excused)</option>
                  <option value="absent">ALPA (Absent)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jam Check-In (HH:mm:ss)</label>
                <input
                  type="text"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2"
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
