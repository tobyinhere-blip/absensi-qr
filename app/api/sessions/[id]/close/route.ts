import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSession();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Silakan login.' } },
        { status: 401 }
      );
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: params.id },
      data: { status: 'closed' },
    });

    await prisma.auditLog.create({
      data: {
        user_id: sessionUser.id,
        action: 'CLOSE_SESSION',
        entity_type: 'AttendanceSession',
        entity_id: updated.id,
        metadata: JSON.stringify({ name: updated.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Sesi berhasil ditutup.', data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
