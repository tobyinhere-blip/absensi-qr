import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv | xlsx | json
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('class_id') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (date) where.attendance_date = date;
    if (status) where.status = status;
    if (classId) where.student = { class_id: classId };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { class: true } },
        session: true,
      },
      orderBy: [{ student: { name: 'asc' } }],
    });

    const exportData = records.map((r, index) => ({
      No: index + 1,
      'ID Siswa': r.student.student_id,
      'Nama Siswa': r.student.name,
      Kelas: r.student.class.name,
      Tanggal: r.attendance_date,
      'Jam Masuk': r.check_in_time,
      Status:
        r.status === 'present'
          ? 'Hadir'
          : r.status === 'late'
          ? 'Terlambat'
          : r.status === 'excused'
          ? 'Izin'
          : 'Alpa',
      Petugas: r.scanned_by || '-',
    }));

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Absensi');
      const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Laporan_Absensi_${date}.xlsx"`,
        },
      });
    }

    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="Laporan_Absensi_${date}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: exportData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
