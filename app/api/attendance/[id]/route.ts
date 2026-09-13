import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat mengubah data absensi.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, check_in_time } = body;

    const existing = await prisma.attendance.findUnique({
      where: { id: params.id },
      include: { student: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Data absensi tidak ditemukan.' } },
        { status: 404 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(check_in_time && { check_in_time }),
      },
      include: { student: { include: { class: true } } },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'EDIT_ATTENDANCE',
        entity_type: 'Attendance',
        entity_id: updated.id,
        metadata: JSON.stringify({
          student_name: existing.student.name,
          old_status: existing.status,
          new_status: updated.status,
          old_time: existing.check_in_time,
          new_time: updated.check_in_time,
        }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
