import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { class: true, attendances: { take: 10, orderBy: { created_at: 'desc' } } },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Siswa tidak ditemukan.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat merubah data siswa.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, class_id, photo, status, student_id } = body;

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(student_id && { student_id: student_id.trim() }),
        ...(class_id && { class_id }),
        ...(photo !== undefined && { photo }),
        ...(status && { status }),
      },
      include: { class: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'UPDATE_STUDENT',
        entity_type: 'Student',
        entity_id: student.id,
        metadata: JSON.stringify({ student_id: student.student_id, name: student.name }),
      },
    });

    return NextResponse.json({ success: true, data: student });
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat menghapus siswa.' } },
        { status: 403 }
      );
    }

    const student = await prisma.student.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'DELETE_STUDENT',
        entity_type: 'Student',
        entity_id: params.id,
        metadata: JSON.stringify({ student_id: student.student_id, name: student.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Siswa berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
