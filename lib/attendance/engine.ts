import { prisma } from '../db/prisma';

export interface ScanResultSuccess {
  success: true;
  message: string;
  data: {
    student: {
      id: string;
      student_id: string;
      name: string;
      class: string;
      photo?: string | null;
    };
    attendance: {
      id: string;
      status: 'present' | 'late';
      check_in_time: string;
      attendance_date: string;
    };
    session: {
      id: string;
      name: string;
    };
  };
}

export interface ScanResultError {
  success: false;
  error: {
    code:
      | 'INVALID_QR'
      | 'STUDENT_NOT_FOUND'
      | 'STUDENT_INACTIVE'
      | 'SESSION_NOT_FOUND'
      | 'SESSION_CLOSED'
      | 'ALREADY_CHECKED_IN'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'VALIDATION_ERROR'
      | 'SERVER_ERROR';
    message: string;
    existingAttendance?: {
      check_in_time: string;
      status: string;
    };
  };
}

export type ScanResult = ScanResultSuccess | ScanResultError;

/**
 * Returns current server time formatted as YYYY-MM-DD and HH:mm:ss
 */
export function getServerTime(overrideTime?: Date) {
  const now = overrideTime || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;

  return { now, dateStr, timeStr };
}

/**
 * Converts HH:mm or HH:mm:ss to total seconds for accurate time comparison.
 */
export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

export async function processQRScan(
  qrToken: string,
  scannedBy?: string,
  targetSessionId?: string,
  overrideTime?: Date
): Promise<ScanResult> {
  const { dateStr, timeStr } = getServerTime(overrideTime);

  // 1. Validate QR Token & Find Student
  const student = await prisma.student.findUnique({
    where: { qr_token: qrToken },
    include: { class: true },
  });

  if (!student) {
    return {
      success: false,
      error: {
        code: 'INVALID_QR',
        message: `Kode QR '${qrToken}' tidak terdaftar.`,
      },
    };
  }

  // 2. Check Student Status
  if (student.status === 'inactive') {
    return {
      success: false,
      error: {
        code: 'STUDENT_INACTIVE',
        message: 'Status siswa nonaktif.',
      },
    };
  }

  // 3. Auto-close past open sessions (date < dateStr)
  await prisma.attendanceSession.updateMany({
    where: {
      date: { lt: dateStr },
      status: 'open',
    },
    data: {
      status: 'closed',
    },
  });

  // Find or Create Session for Today
  let session = null;
  if (targetSessionId) {
    session = await prisma.attendanceSession.findUnique({
      where: { id: targetSessionId },
    });
  } else {
    // Find open session specifically for TODAY
    session = await prisma.attendanceSession.findFirst({
      where: {
        date: dateStr,
        status: 'open',
      },
      orderBy: { created_at: 'desc' },
    });

    // If no open session exists for today, auto-create a daily session using school settings
    if (!session) {
      const settings = await prisma.settings.findUnique({
        where: { id: 'default' },
      });

      const startTime = settings?.default_start_time || '07:00';
      const lateAfter = settings?.default_late_time || '07:30';
      const endTime = settings?.default_end_time || '08:30';

      session = await prisma.attendanceSession.create({
        data: {
          name: `Absensi Harian (${dateStr})`,
          date: dateStr,
          start_time: startTime,
          late_after: lateAfter,
          end_time: endTime,
          status: 'open',
        },
      });
    }
  }

  if (!session) {
    return {
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'Tidak ada sesi absensi yang terbuka saat ini.',
      },
    };
  }

  if (session.status !== 'open') {
    return {
      success: false,
      error: {
        code: 'SESSION_CLOSED',
        message: 'Sesi absensi sudah ditutup.',
      },
    };
  }

  // 4. Check Duplicate Attendance
  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      student_id_session_id: {
        student_id: student.id,
        session_id: session.id,
      },
    },
  });

  if (existingAttendance) {
    return {
      success: false,
      error: {
        code: 'ALREADY_CHECKED_IN',
        message: `${student.name} sudah melakukan absensi pada jam ${existingAttendance.check_in_time}.`,
        existingAttendance: {
          check_in_time: existingAttendance.check_in_time,
          status: existingAttendance.status,
        },
      },
    };
  }

  // 5. Determine Status (present vs late)
  const currentSeconds = timeToSeconds(timeStr);
  const lateSeconds = timeToSeconds(session.late_after);
  const status: 'present' | 'late' = currentSeconds <= lateSeconds ? 'present' : 'late';

  // 6. Save Attendance in Database
  const attendance = await prisma.attendance.create({
    data: {
      student_id: student.id,
      session_id: session.id,
      attendance_date: dateStr,
      check_in_time: timeStr,
      status: status,
      scanned_by: scannedBy || 'System',
    },
  });

  // 7. Record Audit Log
  await prisma.auditLog.create({
    data: {
      user_id: scannedBy || 'System',
      action: 'SCAN_ATTENDANCE',
      entity_type: 'Attendance',
      entity_id: attendance.id,
      metadata: JSON.stringify({
        student_id: student.student_id,
        student_name: student.name,
        class: student.class.name,
        status: status,
        check_in_time: timeStr,
      }),
    },
  });

  return {
    success: true,
    message: status === 'present' ? 'Absensi Berhasil (Hadir)' : 'Absensi Berhasil (Terlambat)',
    data: {
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        class: student.class.name,
        photo: student.photo,
      },
      attendance: {
        id: attendance.id,
        status: status,
        check_in_time: timeStr,
        attendance_date: dateStr,
      },
      session: {
        id: session.id,
        name: session.name,
      },
    },
  };
}
