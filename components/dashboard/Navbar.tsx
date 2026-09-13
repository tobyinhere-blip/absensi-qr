'use client';

import { useEffect, useState } from 'react';
import { User, Bell, QrCode, Menu } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const todayDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-[#F4F6F9] border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl border border-slate-200/80 transition-all active:scale-95 shadow-sm"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        <h2 className="text-xs sm:text-sm font-semibold text-slate-500">
          SMP Negeri 1 <span className="hidden xs:inline text-slate-800 font-bold ml-1">• System Online</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
          <span>{todayDateStr}</span>
          <span className="text-slate-400">📅</span>
        </div>

        {/* Buka Scanner CTA Button */}
        <Link
          href="/scan"
          className="px-4 py-2 bg-[#374291] hover:bg-[#2b3475] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <QrCode className="w-4 h-4 stroke-[1.75]" />
          <span>Buka Scanner</span>
        </Link>

        {/* Bell Notification & Profile Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200/80 pl-3">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all">
            <Bell className="w-5 h-5 stroke-[1.75]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-2.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-slate-200 font-extrabold text-slate-700 text-xs flex items-center justify-center">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Admin Sekolah'}</p>
              <p className="text-[10px] text-slate-400 font-medium capitalize">{user?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
