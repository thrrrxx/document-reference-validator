import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * In-memory sliding window rate limiter
 * Menyimpan jumlah hit per IP dengan TTL otomatis.
 * Sangat efektif meredam serangan HTTP Flood (L7 DDoS) dan Brute-Force pada Next.js API.
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan memory setiap 5 menit agar tidak terjadi memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string, maxRequests: number, windowSeconds: number): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

// Daftar User-Agent bot scanner / scraper jahat yang sering digunakan dalam serangan DDoS & Vulnerability Scans
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'masscan',
  'nmap',
  'acunetix',
  'zgrab',
  'havij',
  'dirbuster',
  'gobuster',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Dapatkan Real Client IP (Diambil dari Cloudflare header 'cf-connecting-ip' jika ada)
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // 2. Blokir bot scanner mencurigakan pada route API
  if (pathname.startsWith('/api/')) {
    const isMaliciousBot = BLOCKED_USER_AGENTS.some((bot) => userAgent.includes(bot));
    if (isMaliciousBot) {
      console.warn(`[Security Middleware] Memblokir bot mencurigakan dari IP ${clientIp}: ${userAgent}`);
      return new NextResponse(
        JSON.stringify({ error: 'Access denied: Automated scanner detected.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Rate Limiting untuk Endpoint Autentikasi (/api/auth/*)
  // Maksimal 10 percobaan per 60 detik per IP (Anti Brute-Force & Credential Stuffing)
  if (pathname.startsWith('/api/auth/')) {
    const rateLimitKey = `auth:${clientIp}`;
    const { allowed, remaining, retryAfter } = checkRateLimit(rateLimitKey, 10, 60);

    if (!allowed) {
      console.warn(`[DDoS Shield] Rate limit terlampaui untuk ${pathname} oleh IP: ${clientIp}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Terlalu banyak permintaan (Rate limit terlampaui). Silakan tunggu sebentar sebelum mencoba kembali.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 4. Rate Limiting untuk Endpoint API Umum (/api/*)
  // Maksimal 60 request per menit per IP (Anti L7 HTTP Flood DDoS)
  if (pathname.startsWith('/api/')) {
    const rateLimitKey = `api:${clientIp}`;
    const { allowed, retryAfter } = checkRateLimit(rateLimitKey, 60, 60);

    if (!allowed) {
      console.warn(`[DDoS Shield] General API Rate limit terlampaui oleh IP: ${clientIp}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Aktivitas request terlalu tinggi. Akses dibatasi untuk menjaga kestabilan server.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        }
      );
    }
  }

  // 5. Injeksi Security Headers ke respons
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Jalankan middleware untuk route API dan rute sensitif, lewati static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
