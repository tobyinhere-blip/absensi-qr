import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const where: any = {};
    if (date) where.date = date;
    if (status) where.status = status;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: [{ date: 'desc' }, { start_time: 'asc' }],
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSession();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat membuat sesi absensi.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, date, start_time, late_after, end_time, status } = body;

    if (!name || !date || !start_time || !late_after || !end_time) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Semua kolom sesi wajib diisi.' } },
        { status: 400 }
      );
    }

    const newSession = await prisma.attendanceSession.create({
      data: {
        name: name.trim(),
        date: date.trim(),
        start_time: start_time.trim(),
        late_after: late_after.trim(),
        end_time: end_time.trim(),
        status: status || 'open',
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: sessionUser.id,
        action: 'CREATE_SESSION',
        entity_type: 'AttendanceSession',
        entity_id: newSession.id,
        metadata: JSON.stringify({ name: newSession.name, date: newSession.date }),
      },
    });

    return NextResponse.json({ success: true, data: newSession }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
