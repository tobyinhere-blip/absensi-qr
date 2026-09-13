import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const classId = searchParams.get('class_id') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const sessionId = searchParams.get('session_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (date) where.attendance_date = date;
    if (status) where.status = status;
    if (sessionId) where.session_id = sessionId;

    if (classId) {
      where.student = { ...where.student, class_id: classId };
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { name: { contains: search } },
          { student_id: { contains: search } },
        ],
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: { class: true },
          },
          session: true,
        },
        orderBy: [{ created_at: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
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
