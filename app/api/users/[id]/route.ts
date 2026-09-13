import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession, hashPassword } from '@/lib/auth/session';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat merubah user.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, role, status, password } = body;

    const data: any = {};
    if (name) data.name = name.trim();
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) data.password_hash = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'UPDATE_USER',
        entity_type: 'User',
        entity_id: user.id,
        metadata: JSON.stringify({ email: user.email, role: user.role }),
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat menghapus user.' } },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (session.id === params.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Anda tidak dapat menghapus akun Anda sendiri.' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'DELETE_USER',
        entity_type: 'User',
        entity_id: params.id,
        metadata: JSON.stringify({ email: user.email }),
      },
    });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
