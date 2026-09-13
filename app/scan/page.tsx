'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RefreshCw,
  Clock,
  SwitchCamera,
  Upload,
  Image as ImageIcon,
  KeyRound,
  Send,
} from 'lucide-react';

interface ScanFeedback {
  type: 'success_present' | 'success_late' | 'duplicate' | 'invalid' | 'inactive' | 'closed' | 'error';
  title: string;
  message: string;
  student?: {
    name: string;
    student_id: string;
    class: string;
  };
  time?: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const html5QrCodeRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [userSession, setUserSession] = useState<any>(null);

  // Manual token input state
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Audio Beep generator using Web Audio API
  const playAudioBeep = useCallback((type: 'success' | 'warning' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  }, []);

  // Fetch current user session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUserSession(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(() => {});
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Process Scanned QR Token
  const handleDecodedToken = useCallback(
    async (rawToken: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // Clean token (extract token if it's a URL or has whitespace)
      let cleanToken = rawToken.trim();
      if (cleanToken.includes('/s/')) {
        cleanToken = cleanToken.split('/s/').pop()?.split('?')[0] || cleanToken;
      } else if (cleanToken.includes('token=')) {
        cleanToken = cleanToken.split('token=').pop()?.split('&')[0] || cleanToken;
      }

      try {
        const res = await fetch('/api/attendance/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token: cleanToken }),
        });

        const data = await res.json();

        if (data.success) {
          const isPresent = data.data.attendance.status === 'present';
          playAudioBeep('success');
          setScannedCount((prev) => prev + 1);
          setFeedback({
            type: isPresent ? 'success_present' : 'success_late',
            title: isPresent ? '✓ Absensi Berhasil (Hadir)' : '✓ Absensi Berhasil (Terlambat)',
            message: isPresent ? 'Siswa hadir tepat waktu' : 'Siswa hadir terlambat',
            student: {
              name: data.data.student.name,
              student_id: data.data.student.student_id,
              class: data.data.student.class,
            },
            time: data.data.attendance.check_in_time,
          });
        } else {
          const code = data.error?.code;
          if (code === 'ALREADY_CHECKED_IN') {
            playAudioBeep('warning');
            setFeedback({
              type: 'duplicate',
              title: '⚠ Sudah Melakukan Absensi',
              message: data.error.message || 'Siswa sudah tercatat absen hari ini.',
            });
          } else if (code === 'INVALID_QR') {
            playAudioBeep('error');
            setFeedback({
              type: 'invalid',
              title: '✕ QR Code Tidak Valid',
              message: `Kode QR '${cleanToken}' tidak terdaftar dalam sistem.`,
            });
          } else if (code === 'STUDENT_INACTIVE') {
            playAudioBeep('error');
            setFeedback({
              type: 'inactive',
              title: '✕ Siswa Nonaktif',
              message: 'Status siswa nonaktif dalam database.',
            });
          } else if (code === 'SESSION_CLOSED' || code === 'SESSION_NOT_FOUND') {
            playAudioBeep('warning');
            setFeedback({
              type: 'closed',
              title: '⚠ Sesi Absensi Ditutup',
              message: data.error.message || 'Tidak ada sesi absensi aktif.',
            });
          } else {
            playAudioBeep('error');
            setFeedback({
              type: 'error',
              title: '✕ Terjadi Kesalahan',
              message: data.error?.message || 'Gagal memproses absensi.',
            });
          }
        }
      } catch (err) {
        playAudioBeep('error');
        setFeedback({
          type: 'error',
          title: '✕ Gangguan Jaringan',
          message: 'Tidak dapat terhubung ke server.',
        });
      } finally {
        setTimeout(() => {
          setFeedback(null);
          isProcessingRef.current = false;
        }, 1800);
      }
    },
    [playAudioBeep]
  );

  // Initialize and start direct camera stream
  const startCameraStream = useCallback(
    async (cameraIdOrConfig?: any) => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode('qr-reader');
        }

        const instance = html5QrCodeRef.current;

        if (instance.isScanning) {
          await instance.stop();
        }

        // Fetch camera devices list
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        } catch (e) {}

        const config = cameraIdOrConfig || { facingMode: 'environment' };

        // Dynamic QR box calculation for maximum scan coverage (85% of smallest dimension)
        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = 0.85;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        };

        await instance.start(
          config,
          {
            fps: 10,
            qrbox: qrboxFunction,
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          (decodedText: string) => {
            handleDecodedToken(decodedText);
          },
          () => {}
        );

        setIsScanning(true);
      } catch (err: any) {
        console.error('Camera start error:', err);
        setIsScanning(false);
        setCameraError(
          'Tidak dapat mengakses kamera. Pastikan izin kamera diizinkan di peramban Anda.'
        );
      }
    },
    [handleDecodedToken]
  );

  useEffect(() => {
    startCameraStream();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [startCameraStream]);

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camId = e.target.value;
    setSelectedCameraId(camId);
    if (camId) {
      startCameraStream(camId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      }
      const instance = html5QrCodeRef.current;

      if (instance.isScanning) {
        await instance.stop();
        setIsScanning(false);
      }

      const decodedText = await instance.scanFile(file, true);
      if (decodedText) {
        handleDecodedToken(decodedText);
      }
    } catch (err) {
      playAudioBeep('error');
      setFeedback({
        type: 'error',
        title: '✕ QR Code Tidak Terdeteksi',
        message: 'Gambar tidak berisi Kode QR yang valid.',
      });
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setManualLoading(true);
    handleDecodedToken(manualToken.trim()).finally(() => {
      setManualLoading(false);
      setManualToken('');
    });
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col selection:bg-blue-600/30">
      {/* Ambient background glow lights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-emerald-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="glass-panel border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
              Pemindai QR Absensi
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO HUD
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {userSession ? `${userSession.name} (${userSession.role.toUpperCase()})` : 'Petugas Absensi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Total Scan: <strong className="text-white font-mono">{scannedCount}</strong></span>
          </div>

          {userSession?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700/80 transition-all shadow-md active:scale-95"
            >
              Dashboard Admin
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all"
            title="Keluar"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full relative z-10">
        {/* Status Badge & Camera Switch Controls */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isScanning ? 'bg-emerald-400' : 'bg-rose-400'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isScanning ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className={isScanning ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isScanning ? 'Kamera Ready & Monitoring' : 'Kamera Nonaktif'}
            </span>
          </div>

          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
              <SwitchCamera className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">
                  Ganti Kamera
                </option>
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id} className="bg-slate-900">
                    {cam.label || `Camera ${cam.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Futuristic Video Camera Reader Container */}
        <div className="w-full glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl relative min-h-[340px] flex flex-col items-center justify-center group glow-blue">
          {/* Animated HUD Corner Brackets */}
          <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-blue-500 z-20 pointer-events-none rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-blue-500 z-20 pointer-events-none rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-7 h-7 border-b-2 border-l-2 border-blue-500 z-20 pointer-events-none rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-7 h-7 border-b-2 border-r-2 border-blue-500 z-20 pointer-events-none rounded-br-lg" />

          {/* Sweeping Laser Scan Line Overlay */}
          {isScanning && !feedback && (
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-20 pointer-events-none animate-scan-laser shadow-[0_0_15px_#22d3ee]" />
          )}

          {/* Direct Camera Viewfinder HUD Overlay Notification (Directly inside Camera Box as requested!) */}
          {feedback && (
            <div
              className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 ${
                feedback.type === 'success_present'
                  ? 'bg-emerald-950/90 text-emerald-100'
                  : feedback.type === 'success_late'
                  ? 'bg-amber-950/90 text-amber-100'
                  : feedback.type === 'duplicate'
                  ? 'bg-amber-950/90 text-amber-100'
                  : 'bg-rose-950/90 text-rose-100'
              }`}
            >
              <div className="mb-3 p-4 rounded-3xl bg-white/10 shadow-2xl border border-white/20 animate-bounce">
                {feedback.type === 'success_present' && <CheckCircle2 className="w-14 h-14 text-emerald-400" />}
                {feedback.type === 'success_late' && <CheckCircle2 className="w-14 h-14 text-amber-400" />}
                {feedback.type === 'duplicate' && <AlertTriangle className="w-14 h-14 text-amber-400" />}
                {(feedback.type === 'invalid' || feedback.type === 'inactive' || feedback.type === 'closed' || feedback.type === 'error') && (
                  <XCircle className="w-14 h-14 text-rose-400" />
                )}
              </div>

              <h2 className="text-xl font-extrabold tracking-tight mb-1">{feedback.title}</h2>
              <p className="text-xs opacity-90 max-w-xs leading-relaxed">{feedback.message}</p>

              {feedback.student && (
                <div className="mt-4 pt-3 border-t border-white/20 w-full max-w-xs grid grid-cols-2 gap-2 text-left text-xs bg-black/30 p-3 rounded-xl border border-white/10">
                  <div>
                    <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block">Siswa</span>
                    <p className="font-bold text-white truncate">{feedback.student.name}</p>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block">NIS</span>
                    <p className="font-mono font-bold text-blue-300">{feedback.student.student_id}</p>
                  </div>
                  <div>
                    <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block">Kelas</span>
                    <p className="font-semibold text-slate-200">{feedback.student.class}</p>
                  </div>
                  {feedback.time && (
                    <div>
                      <span className="opacity-70 text-[10px] uppercase font-bold tracking-wider block">Waktu</span>
                      <p className="font-mono font-bold text-emerald-300">{feedback.time}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center z-20 max-w-xs">
              <Camera className="w-12 h-12 text-rose-500 mx-auto mb-3 animate-bounce" />
              <p className="text-rose-300 text-xs font-semibold mb-4 leading-relaxed">{cameraError}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startCameraStream()}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  Aktifkan Kamera Ulang
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Unggah Gambar QR
                </button>
              </div>
            </div>
          )}

          {/* Target container for HTML5 QR Reader */}
          <div id="qr-reader" className="w-full h-full object-cover relative z-10" />

          {/* Hidden File Input for Image Upload Scanning */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Action Toolbar */}
        <div className="w-full mt-4 flex items-center justify-between text-xs gap-3">
          <button
            onClick={() => startCameraStream()}
            className="flex-1 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Muat Ulang Kamera</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan dari Gambar</span>
          </button>
        </div>

        {/* Manual Token Input Box */}
        <form onSubmit={handleManualSubmit} className="w-full mt-4 flex gap-2">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Atau Ketik / Paste Token QR Siswa..."
              className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={!manualToken.trim() || manualLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Absen</span>
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-400 font-medium">
          <p>Arahkan Kode QR Siswa ke area pemindai. Sistem akan otomatis memproses data.</p>
        </div>
      </main>
    </div>
  );
}
