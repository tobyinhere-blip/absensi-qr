import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: classes });
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat membuat kelas.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, grade, academic_year } = body;

    if (!name || !grade || !academic_year) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama kelas, Tingkat, dan Tahun Ajaran wajib diisi.' } },
        { status: 400 }
      );
    }

    const existing = await prisma.class.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `Nama kelas '${name}' sudah ada.` } },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        grade: grade.trim(),
        academic_year: academic_year.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'CREATE_CLASS',
        entity_type: 'Class',
        entity_id: newClass.id,
        metadata: JSON.stringify({ name: newClass.name }),
      },
    });

    return NextResponse.json({ success: true, data: newClass }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
