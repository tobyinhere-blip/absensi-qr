import { NextRequest, NextResponse } from 'next/server';
import { processQRScan } from '@/lib/attendance/engine';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { qr_token, session_id } = body;

    if (!qr_token || typeof qr_token !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Kode QR wajib dikirimkan.',
          },
        },
        { status: 400 }
      );
    }

    const result = await processQRScan(
      qr_token.trim(),
      session.name || session.email,
      session_id
    );

    if (!result.success) {
      // Map domain error code to proper HTTP status
      const statusMap: Record<string, number> = {
        INVALID_QR: 404,
        STUDENT_NOT_FOUND: 404,
        STUDENT_INACTIVE: 400,
        SESSION_NOT_FOUND: 404,
        SESSION_CLOSED: 400,
        ALREADY_CHECKED_IN: 409,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
      };

      const statusCode = statusMap[result.error.code] || 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'Terjadi kesalahan sistem.',
        },
      },
      { status: 500 }
    );
  }
}
