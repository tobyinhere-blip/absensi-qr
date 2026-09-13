'use client';

import { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Calendar, Filter, Printer, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) setClasses(data.data);
    } catch (e) {}
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ date, class_id: filterClass }).toString();
      const res = await fetch(`/api/attendance?${query}&limit=500`);
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
    fetchReportData();
  }, [date, filterClass]);

  const exportCSV = () => {
    window.open(`/api/reports/attendance/export?format=csv&date=${date}&class_id=${filterClass}`);
  };

  const exportXLSX = () => {
    window.open(`/api/reports/attendance/export?format=xlsx&date=${date}&class_id=${filterClass}`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('LAPORAN ABSENSI SISWA', 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${date} | Filter Kelas: ${filterClass ? 'Tertentu' : 'Semua Kelas'}`, 14, 22);

    const tableColumn = ['No', 'ID Siswa', 'Nama Siswa', 'Kelas', 'Jam Check-in', 'Status'];
    const tableRows = records.map((r, i) => [
      i + 1,
      r.student?.student_id,
      r.student?.name,
      r.student?.class?.name,
      r.check_in_time,
      r.status === 'present' ? 'HADIR' : r.status === 'late' ? 'TERLAMBAT' : r.status === 'excused' ? 'IZIN' : 'ALPA',
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199] },
    });

    doc.save(`Laporan_Absensi_${date}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Laporan & Ekspor Absensi</h1>
          <p className="text-sm text-slate-400 mt-0.5">Unduh rekapitulasi data absensi siswa dalam format CSV, Excel, dan PDF</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={exportXLSX}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Pilih Tanggal:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Pilih Kelas:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Record: <strong className="text-white">{records.length}</strong>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Pratinjau Laporan Absensi</h3>
          <span className="text-xs text-slate-400">Tanggal: {date}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">ID Siswa</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Jam Check-In</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-400">{r.student?.student_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{r.student?.name}</td>
                  <td className="py-3 px-4 text-slate-300">{r.student?.class?.name}</td>
                  <td className="py-3 px-4 font-mono text-white">{r.check_in_time}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        r.status === 'present'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : r.status === 'late'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : r.status === 'excused'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
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
                  <td className="py-3 px-4 text-slate-400">{r.scanned_by || '-'}</td>
                </tr>
              ))}

              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada data absensi untuk tanggal yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
