'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, GraduationCap, X, Loader2, AlertTriangle } from 'lucide-react';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    grade: '10',
    academic_year: '2025/2026',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Gagal membuat kelas.');
        setSubmitLoading(false);
        return;
      }

      setShowAddModal(false);
      setFormData({ name: '', grade: '10', academic_year: '2025/2026' });
      fetchClasses();
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${name}?`)) return;

    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchClasses();
      } else {
        alert(data.error?.message || 'Gagal menghapus kelas.');
      }
    } catch (e) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const openStudentsModal = async (cls: any) => {
    try {
      const res = await fetch(`/api/classes/${cls.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedClass(data.data);
        setShowStudentsModal(true);
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Kelas</h1>
          <p className="text-sm text-slate-400 mt-0.5">Kelola daftar kelas dan alokasi siswa per kelas</p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', grade: '10', academic_year: '2025/2026' });
            setFormError('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Tingkat {c.grade}
                </span>
                <span className="text-[11px] text-slate-400">TA {c.academic_year}</span>
              </div>

              <h3 className="font-extrabold text-xl text-white mt-3">{c.name}</h3>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span>
                  Total Siswa: <strong className="text-white font-mono">{c._count?.students ?? 0}</strong> orang
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => openStudentsModal(c)}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Lihat Anggota Siswa →
              </button>

              <button
                onClick={() => handleDeleteClass(c.id, c.name)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Hapus Kelas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add Class */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Tambah Kelas Baru</h3>
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
                <label className="block text-slate-300 font-semibold mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: XI IPA 1"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tingkat Kelas *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="7">Kelas 7 (VII)</option>
                  <option value="8">Kelas 8 (VIII)</option>
                  <option value="9">Kelas 9 (IX)</option>
                  <option value="10">Kelas 10 (X)</option>
                  <option value="11">Kelas 11 (XI)</option>
                  <option value="12">Kelas 12 (XII)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tahun Ajaran *</label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="2025/2026"
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
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
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Students in Class */}
      {showStudentsModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Anggota Kelas {selectedClass.name}</h3>
                <p className="text-xs text-slate-400">Total {selectedClass.students?.length || 0} siswa terdaftar</p>
              </div>
              <button onClick={() => setShowStudentsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
              {selectedClass.students?.map((s: any, idx: number) => (
                <div key={s.id} className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{idx + 1}. {s.name}</span>
                    <span className="block text-[11px] font-mono text-blue-400">NIS: {s.student_id}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">TOKEN: {s.qr_token}</span>
                </div>
              ))}

              {(!selectedClass.students || selectedClass.students.length === 0) && (
                <p className="text-slate-500 text-center py-6">Belum ada siswa di kelas ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
