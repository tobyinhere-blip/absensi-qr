'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  QrCode,
  Search,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/reports/attendance?date=${dateStr}&class_id=${filterClass}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh dashboard data every 10 seconds for real-time scan feed
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [filterClass]);

  const presentCount = reportData?.present ?? 0;
  const lateCount = reportData?.late ?? 0;
  const absentCount = reportData?.absent ?? 0;
  const excusedCount = reportData?.excused ?? 0;
  const totalStudents = reportData?.totalStudents ?? 0;

  const getPercent = (count: number) =>
    totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

  const cards = [
    {
      title: 'TOTAL SISWA',
      value: totalStudents,
      icon: Users,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      subtext: '100% Terdaftar',
      subtextColor: 'text-slate-500',
    },
    {
      title: 'HADIR',
      value: presentCount,
      icon: CheckCircle2,
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      subtext: `${getPercent(presentCount)}% dari total`,
      subtextColor: 'text-emerald-600 font-semibold',
    },
    {
      title: 'TERLAMBAT',
      value: lateCount,
      icon: Clock,
      badgeColor: 'bg-amber-50 text-amber-600 border-amber-100',
      subtext: `${getPercent(lateCount)}% dari total`,
      subtextColor: 'text-amber-600 font-semibold',
    },
    {
      title: 'ALPA / ABSEN',
      value: absentCount,
      icon: XCircle,
      badgeColor: 'bg-rose-50 text-rose-600 border-rose-100',
      subtext: `${getPercent(absentCount)}% dari total`,
      subtextColor: 'text-rose-600 font-semibold',
    },
    {
      title: 'IZIN / SAKIT',
      value: excusedCount,
      icon: FileText,
      badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
      subtext: `${getPercent(excusedCount)}% dari total`,
      subtextColor: 'text-slate-500 font-semibold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Absensi</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Statistik kehadiran siswa secara real-time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="text-slate-400">📅</span>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/scan"
            className="px-4 py-2.5 bg-[#374291] hover:bg-[#2b3475] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4 stroke-[1.75]" />
            <span>Buka Scanner</span>
          </Link>
        </div>
      </div>

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${card.badgeColor}`}>
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {card.title}
                </span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
                  {card.value}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[11px]">
                <span className={card.subtextColor}>{card.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lower Content Grid: Kehadiran per Kelas (col-span-4) & Aktivitas Scan Terbaru (col-span-8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Kehadiran per Kelas */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight mb-5">Kehadiran per Kelas</h3>

            <div className="space-y-5">
              {reportData?.classStats?.map((cls: any) => (
                <div key={cls.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cls.name}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {cls.presentOrLate}/{cls.totalStudents}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2B3577] rounded-full transition-all duration-500"
                      style={{ width: `${cls.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {(!reportData?.classStats || reportData.classStats.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-6">Belum ada data kelas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Aktivitas Scan Terbaru */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight mb-4">Aktivitas Scan Terbaru</h3>

            <div className="flex gap-4">
              {/* Left Mini Tab Sidebar */}
              <div className="flex flex-col gap-2 p-1.5 bg-slate-100/70 rounded-xl shrink-0 h-fit">
                <div className="p-2 bg-[#374291]/10 text-[#374291] rounded-lg">
                  <QrCode className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Clock className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Search className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>

              {/* Scan Activity Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs border-separate border-spacing-y-1">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-3 rounded-l-xl">Name ●</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">NIS</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Class</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Time</th>
                      <th className="py-2.5 px-3 rounded-r-xl whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData?.recentScans?.map((record: any) => {
                      const isLate = record.status === 'late';
                      const isPresent = record.status === 'present';
                      const isExcused = record.status === 'excused';
                      
                      const statusColor = isPresent
                        ? 'text-emerald-600'
                        : isLate
                        ? 'text-amber-600'
                        : isExcused
                        ? 'text-blue-600'
                        : 'text-rose-600';
                        
                      const statusDot = isPresent
                        ? 'bg-emerald-500'
                        : isLate
                        ? 'bg-amber-500'
                        : isExcused
                        ? 'bg-blue-500'
                        : 'bg-rose-500';

                      const statusLabel = isPresent
                        ? 'Hadir'
                        : isLate
                        ? 'Terlambat'
                        : isExcused
                        ? 'Izin'
                        : 'Alpa';

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3 px-3 font-bold text-slate-900">{record.student?.name}</td>
                          <td className="py-3 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">{record.student?.student_id}</td>
                          <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">{record.student?.class?.name}</td>
                          <td className="py-3 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">{record.check_in_time}</td>
                          <td className="py-3 px-3 font-semibold whitespace-nowrap">
                            <span className={`flex items-center gap-1.5 ${statusColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {(!reportData?.recentScans || reportData.recentScans.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada siswa yang melakukan absensi hari ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-4 pt-3 border-t border-slate-100 text-right text-[11px] text-slate-400 font-medium">
                  Menampilkan {reportData?.recentScans?.length || 0} scan terakhir hari ini
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
