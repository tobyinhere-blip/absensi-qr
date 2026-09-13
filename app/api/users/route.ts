import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession, hashPassword } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak.' } },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat membuat akun user.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, status } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama, Email, dan Password wajib diisi.' } },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Email '${email}' sudah digunakan.` } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: role || 'teacher',
        status: status || 'active',
      },
      select: { id: true, name: true, email: true, role: true, status: true, created_at: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'CREATE_USER',
        entity_type: 'User',
        entity_id: user.id,
        metadata: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
