import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: params.id },
      include: {
        attendances: {
          include: { student: { include: { class: true } } },
          orderBy: { check_in_time: 'desc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'SESSION_NOT_FOUND', message: 'Sesi tidak ditemukan.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat merubah sesi.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, date, start_time, late_after, end_time, status } = body;

    const updated = await prisma.attendanceSession.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(date && { date: date.trim() }),
        ...(start_time && { start_time: start_time.trim() }),
        ...(late_after && { late_after: late_after.trim() }),
        ...(end_time && { end_time: end_time.trim() }),
        ...(status && { status }),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: sessionUser.id,
        action: 'UPDATE_SESSION',
        entity_type: 'AttendanceSession',
        entity_id: updated.id,
        metadata: JSON.stringify({ name: updated.name, status: updated.status }),
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
