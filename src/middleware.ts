import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
async function generateSessionToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(password);
  const messageData = encoder.encode('whatsapp-bulk-session');

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
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

  // Validate the session token
  const expectedToken = await generateSessionToken(adminPassword || '');

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
