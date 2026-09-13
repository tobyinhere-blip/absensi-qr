import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateQRToken } from '@/lib/qr/generator';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat meregenerasi QR Code.' } },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: params.id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Siswa tidak ditemukan.' } },
        { status: 404 }
      );
    }

    const oldToken = student.qr_token;
    const newToken = generateQRToken();

    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: { qr_token: newToken },
      include: { class: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'REGENERATE_QR',
        entity_type: 'Student',
        entity_id: student.id,
        metadata: JSON.stringify({
          student_id: student.student_id,
          name: student.name,
          old_token: oldToken,
          new_token: newToken,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kode QR berhasil diperbarui. Kode QR lama sudah tidak berlaku.',
      data: updatedStudent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
