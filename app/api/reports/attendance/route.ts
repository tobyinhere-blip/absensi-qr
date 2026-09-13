import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const classId = searchParams.get('class_id') || '';

    // Total active students
    const studentWhere: any = { status: 'active' };
    if (classId) studentWhere.class_id = classId;

    const totalStudents = await prisma.student.count({ where: studentWhere });

    // Find attendance records for date
    const attendanceWhere: any = { attendance_date: date };
    if (classId) attendanceWhere.student = { class_id: classId };

    const attendances = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: { student: { include: { class: true } } },
    });

    const presentCount = attendances.filter((a) => a.status === 'present').length;
    const lateCount = attendances.filter((a) => a.status === 'late').length;
    const excusedCount = attendances.filter((a) => a.status === 'excused').length;
    const absentManualCount = attendances.filter((a) => a.status === 'absent').length;

    const checkedInCount = presentCount + lateCount + excusedCount + absentManualCount;
    const unrecordedAbsentCount = Math.max(0, totalStudents - checkedInCount);
    const totalAbsent = absentManualCount + unrecordedAbsentCount;

    // Per-class attendance rates
    const classes = await prisma.class.findMany({
      include: {
        students: { where: { status: 'active' } },
      },
    });

    const classStats = await Promise.all(
      classes.map(async (cls) => {
        const clsTotal = cls.students.length;
        const clsAttendances = await prisma.attendance.count({
          where: {
            attendance_date: date,
            student: { class_id: cls.id },
            status: { in: ['present', 'late'] },
          },
        });
        const percentage = clsTotal > 0 ? Math.round((clsAttendances / clsTotal) * 100) : 0;
        return {
          id: cls.id,
          name: cls.name,
          totalStudents: clsTotal,
          presentOrLate: clsAttendances,
          percentage,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        date,
        totalStudents,
        present: presentCount,
        late: lateCount,
        excused: excusedCount,
        absent: totalAbsent,
        recentScans: attendances.slice(0, 10),
        classStats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
