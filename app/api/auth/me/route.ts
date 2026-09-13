import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Belum terautentikasi.' } },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
  });

  if (!user || user.status !== 'active') {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Akun tidak aktif atau tidak ditemukan.' } },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: user });
}
