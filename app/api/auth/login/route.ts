import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email dan password wajib diisi.' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Email atau password salah.' } },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Email atau password salah.' } },
        { status: 401 }
      );
    }

    const userSession = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'teacher',
    };

    const response = NextResponse.json({
      success: true,
      data: {
        user: userSession,
        redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/scan',
      },
    });

    return await setSessionCookie(userSession, response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Terjadi kesalahan pada server.' } },
      { status: 500 }
    );
  }
}
