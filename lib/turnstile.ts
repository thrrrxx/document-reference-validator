/**
 * Cloudflare Turnstile CAPTCHA Verification Helper
 * Mengamankan endpoint API dari serangan bot, credential stuffing, dan DDoS L7
 */

export interface TurnstileVerifyResult {
  success: boolean;
  message?: string;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

// Secret key default untuk mode testing (Cloudflare Always Passes Test Key)
const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

/**
 * Verifikasi token Cloudflare Turnstile ke endpoint Cloudflare Siteverify
 * @param token - Token yang dihasilkan oleh widget Turnstile di frontend
 * @param remoteIp - Alamat IP pengirim (diambil dari cf-connecting-ip atau x-forwarded-for)
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<TurnstileVerifyResult> {
  // Jika token tidak disertakan oleh client
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      message: 'Verifikasi keamanan (CAPTCHA) wajib diselesaikan.',
      errorCodes: ['missing-input-response'],
    };
  }

  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    (process.env.NODE_ENV !== 'production' ? TEST_SECRET_KEY : '');

  if (!secretKey) {
    console.warn(
      '[Cloudflare Turnstile] PERINGATAN: CLOUDFLARE_TURNSTILE_SECRET_KEY belum dikonfigurasi di environment variables.'
    );
    // Jika di development dan secret belum diisi, kita tolerir atau gunakan test key
    if (process.env.NODE_ENV !== 'production') {
      return { success: true };
    }
    return {
      success: false,
      message: 'Konfigurasi keamanan server belum lengkap (Secret key tidak ditemukan).',
      errorCodes: ['missing-secret-key'],
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        // Timeout 5 detik agar tidak membebani worker jika Cloudflare edge lambat
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `Cloudflare API mengembalikan HTTP ${response.status}`,
        errorCodes: ['upstream-error'],
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      };
    }

    return {
      success: false,
      message: 'Validasi CAPTCHA gagal. Silakan centang ulang verifikasi keamanan.',
      errorCodes: data['error-codes'] || ['invalid-token'],
    };
  } catch (error) {
    console.error('[Cloudflare Turnstile] Gagal memverifikasi token:', error);
    // Jika timeout atau jaringan gagal di dev mode, jangan blokir pengguna
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Cloudflare Turnstile] Meloloskan verifikasi karena berjalan di non-production mode.');
      return { success: true };
    }
    return {
      success: false,
      message: 'Gagal menghubungi server verifikasi CAPTCHA. Silakan coba kembali.',
      errorCodes: ['verification-timeout'],
    };
  }
}
