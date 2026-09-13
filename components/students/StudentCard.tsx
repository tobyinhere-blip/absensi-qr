'use client';

import { useEffect, useState } from 'react';
import { generateQRDataUrl } from '@/lib/qr/generator';
import { User, QrCode, Printer, Download, RefreshCw } from 'lucide-react';

interface StudentCardProps {
  student: {
    id: string;
    student_id: string;
    name: string;
    class: { name: string };
    qr_token: string;
    photo?: string | null;
  };
  schoolName?: string;
  onRegenerateQR?: () => void;
  onClose?: () => void;
}

export default function StudentCard({ student, schoolName = 'SMP NEGERI 1', onRegenerateQR, onClose }: StudentCardProps) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (student.qr_token) {
      generateQRDataUrl(student.qr_token)
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [student.qr_token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${student.student_id}_${student.name.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow flex items-center gap-2 transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          Cetak Kartu Siswa
        </button>

        <button
          onClick={handleDownloadQR}
          className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl shadow flex items-center gap-2 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          Unduh QR Code
        </button>

        {onRegenerateQR && (
          <button
            onClick={onRegenerateQR}
            className="px-3.5 py-2 bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerasi QR
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            Tutup
          </button>
        )}
      </div>

      {/* Printable Card Template */}
      <div
        id="printable-card"
        className="w-[340px] h-[520px] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl border-2 border-blue-500/40 p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden"
      >
        {/* Card Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="text-center border-b border-blue-500/30 pb-3 relative z-10">
          <h2 className="font-extrabold text-sm tracking-wider uppercase text-blue-400">{schoolName}</h2>
          <p className="text-[10px] font-bold tracking-widest text-slate-300 uppercase mt-0.5">KARTU PELAJAR SISWA</p>
        </div>

        {/* Photo & Identity Details */}
        <div className="flex flex-col items-center my-2 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-blue-400/50 flex items-center justify-center overflow-hidden shadow-lg mb-3">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-500" />
            )}
          </div>

          <h3 className="font-bold text-lg text-white text-center leading-tight">{student.name}</h3>
          <p className="text-xs text-blue-300 font-medium mt-0.5">NIS: {student.student_id}</p>
          <span className="inline-block mt-1.5 px-3 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-full text-[11px] font-semibold">
            {student.class.name}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-blue-300/50 flex flex-col items-center justify-center relative z-10">
          {qrUrl ? (
            <img src={qrUrl} alt={`QR Code ${student.student_id}`} className="w-32 h-32 object-contain" />
          ) : (
            <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
              Generating QR...
            </div>
          )}
          <span className="text-[10px] font-mono text-slate-500 mt-1 tracking-wider">
            TOKEN: {student.qr_token}
          </span>
        </div>

        {/* Card Footer */}
        <div className="text-center pt-2 relative z-10">
          <p className="text-[9px] text-slate-400 tracking-wide">Harap bawa kartu ini setiap hari untuk absensi sekolah</p>
        </div>
      </div>
    </div>
  );
}
