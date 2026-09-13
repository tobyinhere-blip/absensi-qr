import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateQRToken } from '@/lib/qr/generator';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('class_id') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { student_id: { contains: search } },
      ];
    }

    if (classId) {
      where.class_id = classId;
    }

    if (status) {
      where.status = status;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: { class: true },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat menambahkan siswa.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { student_id, name, class_id, photo, status } = body;

    if (!student_id || !name || !class_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ID Siswa, Nama, dan Kelas wajib diisi.' } },
        { status: 400 }
      );
    }

    // Check unique student_id
    const existing = await prisma.student.findUnique({
      where: { student_id: student_id.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `ID Siswa '${student_id}' sudah digunakan.` } },
        { status: 400 }
      );
    }

    // Generate unique QR token
    let qrToken = generateQRToken();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const checkToken = await prisma.student.findUnique({ where: { qr_token: qrToken } });
      if (!checkToken) {
        isUnique = true;
      } else {
        qrToken = generateQRToken();
        attempts++;
      }
    }

    const student = await prisma.student.create({
      data: {
        student_id: student_id.trim(),
        name: name.trim(),
        class_id: class_id,
        qr_token: qrToken,
        photo: photo || null,
        status: status || 'active',
      },
      include: { class: true },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'CREATE_STUDENT',
        entity_type: 'Student',
        entity_id: student.id,
        metadata: JSON.stringify({ student_id: student.student_id, name: student.name }),
      },
    });

    return NextResponse.json({ success: true, data: student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
