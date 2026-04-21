import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

function generateSessionToken(password: string): string {
  return crypto
    .createHmac('sha256', password)
    .update('whatsapp-bulk-session')
    .digest('hex');
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for internal Next.js requests & websocket upgrades
  if (
    path.startsWith('/_next') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return NextResponse.next();
  }

  // Public paths – webhooks, login page, auth API, static assets
  if (
    path.startsWith('/api/webhooks') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/login')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password configured, allow access (local dev convenience)
  if (!adminPassword) {
    return NextResponse.next();
  }

  // Validate the session token
  const expectedToken = generateSessionToken(adminPassword);

  if (token && token === expectedToken) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (internal Next.js paths)
     * - favicon.ico
     */
    '/((?!_next|favicon.ico).*)',
  ],
};
