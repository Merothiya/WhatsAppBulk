import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for internal Next.js requests and upgrade requests
  if (
    path.startsWith('/_next') || 
    request.headers.get('upgrade') === 'websocket'
  ) {
    return NextResponse.next();
  }

  // Protect all routes except /api/webhooks and /login
  if (path.startsWith('/api/webhooks') || path.startsWith('/login')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password is set in env, we still allow access for local dev ease,
  // but in production it's highly recommended to set it
  if (!adminPassword || token === adminPassword) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (internal Next.js paths for HMR, static files, etc.)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next|favicon.ico).*)',
  ],
};


