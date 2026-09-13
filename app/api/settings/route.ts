import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          school_name: 'SMP Negeri 1',
          timezone: 'Asia/Makassar',
          default_start_time: '07:00',
          default_late_time: '07:30',
          default_end_time: '08:30',
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Hanya Admin yang dapat mengubah pengaturan.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { school_name, school_logo, timezone, default_start_time, default_late_time, default_end_time } = body;

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        ...(school_name && { school_name: school_name.trim() }),
        ...(school_logo !== undefined && { school_logo }),
        ...(timezone && { timezone: timezone.trim() }),
        ...(default_start_time && { default_start_time: default_start_time.trim() }),
        ...(default_late_time && { default_late_time: default_late_time.trim() }),
        ...(default_end_time && { default_end_time: default_end_time.trim() }),
      },
      create: {
        id: 'default',
        school_name: school_name?.trim() || 'SMP Negeri 1',
        school_logo: school_logo || null,
        timezone: timezone?.trim() || 'Asia/Makassar',
        default_start_time: default_start_time?.trim() || '07:00',
        default_late_time: default_late_time?.trim() || '07:30',
        default_end_time: default_end_time?.trim() || '08:30',
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: session.id,
        action: 'UPDATE_SETTINGS',
        entity_type: 'Settings',
        entity_id: 'default',
        metadata: JSON.stringify({ school_name: settings.school_name, timezone: settings.timezone }),
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
