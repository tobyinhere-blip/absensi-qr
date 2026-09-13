'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  QrCode,
  ClipboardList,
  Clock,
  Users,
  GraduationCap,
  FileSpreadsheet,
  UserCheck,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  userRole?: 'admin' | 'teacher';
}

export default function Sidebar({ userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Pemindai Kamera',
      href: '/scan',
      icon: QrCode,
      roles: ['admin', 'teacher'],
      badge: 'Live',
    },
    {
      name: 'Data Absensi',
      href: '/admin/attendance',
      icon: ClipboardList,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Sesi Absensi',
      href: '/admin/sessions',
      icon: Clock,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Manajemen Siswa',
      href: '/admin/students',
      icon: GraduationCap,
      roles: ['admin'],
    },
    {
      name: 'Manajemen Kelas',
      href: '/admin/classes',
      icon: Users,
      roles: ['admin'],
    },
    {
      name: 'Laporan & Ekspor',
      href: '/admin/reports',
      icon: FileSpreadsheet,
      roles: ['admin'],
    },
    {
      name: 'Kelola Pengguna',
      href: '/admin/users',
      icon: UserCheck,
      roles: ['admin'],
    },
    {
      name: 'Pengaturan Sekolah',
      href: '/admin/settings',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-[#131722] border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      <div>
        {/* Brand Logo */}
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400 shadow-md shadow-indigo-500/10">
            <QrCode className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base leading-tight tracking-tight">Absensi QR</h1>
            <p className="text-[11px] text-slate-400 font-medium">SMP Negeri 1</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#282E47] text-indigo-300 shadow-sm border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>

                {item.badge ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-4 h-4 text-indigo-400 opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4 stroke-[1.75]" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
