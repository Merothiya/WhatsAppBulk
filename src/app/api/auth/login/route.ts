import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// In-memory rate-limiter – 15 attempts per sliding 15-minute window per IP
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitInfo(ip: string) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  // Reset if the window has expired
  if (entry && now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(ip);
    entry = undefined;
  }

  if (!entry) {
    entry = { attempts: 0, firstAttemptAt: now };
    rateLimitStore.set(ip, entry);
  }

  return entry;
}

// Periodically clean up stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([ip, entry]) => {
    if (now - entry.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(ip);
    }
  });
}, 5 * 60 * 1000);

// ---------------------------------------------------------------------------
// Helper – generate a session token from the password
// ---------------------------------------------------------------------------
function generateSessionToken(password: string): string {
  return crypto
    .createHmac('sha256', password)
    .update('whatsapp-bulk-session')
    .digest('hex');
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const entry = getRateLimitInfo(ip);

  // Check rate limit BEFORE processing
  if (entry.attempts >= RATE_LIMIT_MAX) {
    const resetInMs =
      RATE_LIMIT_WINDOW_MS - (Date.now() - entry.firstAttemptAt);
    const resetInMinutes = Math.ceil(resetInMs / 60_000);

    return NextResponse.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfterMinutes: resetInMinutes,
        remainingAttempts: 0,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
      }
    );
  }

  // Parse body
  let password: string;
  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!password || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Password is required' },
      { status: 400 }
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Server is not configured. Set ADMIN_PASSWORD in .env' },
      { status: 500 }
    );
  }

  // Record the attempt
  entry.attempts += 1;

  // Constant-time comparison to prevent timing attacks
  const passwordBuffer = Buffer.from(password);
  const adminBuffer = Buffer.from(adminPassword);

  const isMatch =
    passwordBuffer.length === adminBuffer.length &&
    crypto.timingSafeEqual(passwordBuffer, adminBuffer);

  if (!isMatch) {
    const remaining = RATE_LIMIT_MAX - entry.attempts;
    return NextResponse.json(
      {
        error: 'Incorrect password',
        remainingAttempts: remaining,
      },
      { status: 401 }
    );
  }

  // Success – reset rate limit for this IP and set cookie
  rateLimitStore.delete(ip);

  const sessionToken = generateSessionToken(adminPassword);

  const response = NextResponse.json({ success: true });

  response.cookies.set('admin_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
