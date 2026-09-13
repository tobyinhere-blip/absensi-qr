import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Berhasil logout' });
  return await clearSessionCookie(response);
}
