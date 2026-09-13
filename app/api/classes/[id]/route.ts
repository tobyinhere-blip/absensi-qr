import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        students: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!cls) {
      return NextResponse.json(
        { success: false, error: { code: 'CLASS_NOT_FOUND', message: 'Kelas tidak ditemukan.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cls });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat mengubah data kelas.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, grade, academic_year } = body;

    const cls = await prisma.class.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(grade && { grade: grade.trim() }),
        ...(academic_year && { academic_year: academic_year.trim() }),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'UPDATE_CLASS',
        entity_type: 'Class',
        entity_id: cls.id,
        metadata: JSON.stringify({ name: cls.name }),
      },
    });

    return NextResponse.json({ success: true, data: cls });
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat menghapus kelas.' } },
        { status: 403 }
      );
    }

    const cls = await prisma.class.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'DELETE_CLASS',
        entity_type: 'Class',
        entity_id: params.id,
        metadata: JSON.stringify({ name: cls.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
