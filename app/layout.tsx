import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Attendance System - Sistem Absensi QR Sekolah',
  description: 'Sistem absensi berbasis QR Code cepat dan efisien untuk sekolah.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased text-slate-100 bg-[#070A11] min-h-screen font-sans selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
