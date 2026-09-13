import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api auth login, login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/api/auth/login'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. Unauthenticated users trying to access protected routes -> Redirect to /login
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu.' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-based restrictions: Teacher trying to access admin-only routes
  const adminOnlyPaths = [
    '/admin/users',
    '/admin/settings',
  ];

  if (session.role !== 'admin') {
    const isAdminOnlyPath = adminOnlyPaths.some((p) => pathname.startsWith(p));
    if (isAdminOnlyPath) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Akses ditolak. Membutuhkan peran Admin.' } },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/scan', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/scan/:path*', '/api/:path*'],
};
