# QR Attendance System - Sistem Absensi QR Sekolah

Aplikasi web absensi siswa berbasis QR Code cepat, modern, dan efisien yang dirancang untuk sekolah. Memungkinkan guru atau petugas memindai kartu QR siswa menggunakan kamera smartphone untuk pencatatan kehadiran yang akurat, real-time, dan terproteksi dari absensi ganda.

---

## 🌟 Fitur Utama

- **Pemindai QR Kamera Berkecepatan Tinggi (`/scan`)**:
  - Dioptimalkan untuk pemindaian puluhan siswa secara berurutan tanpa menekan tombol (Auto Reset 1.5s).
  - Umpan balik suara sintetis Web Audio API dan indikator visual (Hijau = Hadir, Kuning = Terlambat, Oranye = Sudah Absen, Merah = QR Tidak Valid).
  - Kompatibel dengan peramban HP modern (Android Chrome, iPhone Safari).
- **Manajemen Siswa & Kartu Pelajar**:
  - Pembuatan **token QR unik terenkripsi acak** (bukan sequential ID atau data sensitif).
  - **Cetak Kartu Pelajar Siswa** (`StudentCard.tsx`) siap cetak ke kertas/kartu PVC.
  - Modul **Regenerasi Kode QR** untuk membatalkan kartu QR lama jika hilang.
- **Manajemen Kelas & Sesi Absensi**:
  - Pengelolaan daftar kelas (Tingkat & Tahun Ajaran).
  - Pengaturan jadwal jam masuk, batas keterlambatan, dan status sesi absensi (Terbuka / Ditutup).
- **Dashboard Administrator Real-Time**:
  - Ringkasan statistik (Total Siswa, Hadir, Terlambat, Alpa, Izin).
  - Visualisasi persentase kehadiran per kelas.
  - Tabel aktivitas pemindaian terbaru secara live.
- **Laporan & Ekspor**:
  - Ekspor data absensi ke format **CSV**, **Excel (.xlsx)**, dan **PDF**.
- **Autentikasi & Keamanan**:
  - Proteksi kata sandi terenkripsi (`bcryptjs`) dan token JWT (`jose`) cookie HTTP-only.
  - Pengendalian hak akses berbasis peran (Admin & Teacher).
  - Proteksi absensi ganda pada tingkat basis data (`@@unique([student_id, session_id])`).
  - Pencatatan Audit Log otomatis untuk setiap aktivitas penting.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend & Backend**: Next.js 14 (App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & ORM**: SQLite (Prisma ORM - 100% kompatibel dengan PostgreSQL)
- **Autentikasi**: JWT via `jose`, `bcryptjs`
- **QR Generator & Scanner**: `qrcode`, `html5-qrcode`
- **Ekspor**: `xlsx`, `jspdf`, `jspdf-autotable`

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Inisialisasi & Migrasi Basis Data
```bash
# Inisialisasi skema basis data SQLite
npx prisma db push

# Isi data awal (Seed admin, guru, kelas, siswa, sesi)
npx prisma db seed
```

### 2. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 3. Kredensial Login Bawaan

- **Akun Admin**:
  - Email: `admin@example.com`
  - Password: `ChangeMe123!`
  - Rute: `/admin/dashboard`

- **Akun Guru / Petugas Absensi**:
  - Email: `teacher@example.com`
  - Password: `ChangeMe123!`
  - Rute: `/scan`

---

## 🧪 Menjalankan Pengujian Otomatis

Aplikasi ini dilengkapi dengan suite pengujian otomatis yang menguji ke-7 skenario penerimaan PRD:

```bash
npm run test
```

---

## 📄 Lisensi
Sistem Absensi QR Sekolah v1.0 - Siap Produksi.
