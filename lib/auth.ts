import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export type Permission =
  | 'FLOW_READ'
  | 'FLOW_CREATE'
  | 'FLOW_LINK'
  | 'FLOW_DELETE'
  | 'FLOW_VALIDATE'
  | 'APPROVAL_VIEW'
  | 'APPROVAL_DECIDE'
  | 'DOCUMENT_VOID'
  | 'ACCURATE_READ'
  | 'ACCURATE_SYNC'
  | 'ACCURATE_PUSH'
  | 'STEP_BOM'
  | 'STEP_PR'
  | 'STEP_PO'
  | 'STEP_GRN'
  | 'STEP_PI'
  | 'STEP_PP';

const ALL_PERMISSIONS: Permission[] = [
  'FLOW_READ',
  'FLOW_CREATE',
  'FLOW_LINK',
  'FLOW_DELETE',
  'FLOW_VALIDATE',
  'APPROVAL_VIEW',
  'APPROVAL_DECIDE',
  'DOCUMENT_VOID',
  'ACCURATE_READ',
  'ACCURATE_SYNC',
  'ACCURATE_PUSH',
  'STEP_BOM',
  'STEP_PR',
  'STEP_PO',
  'STEP_GRN',
  'STEP_PI',
  'STEP_PP',
];

/**
 * Matriks RBAC antar departemen sesuai pemisahan tugas (Segregation of Duties).
 * Role default `USER` memiliki akses operasional standar hingga dipromosikan/diatur ke role departemen spesifik.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  USER: ALL_PERMISSIONS,
  AUDITOR: ['FLOW_READ', 'APPROVAL_VIEW', 'ACCURATE_READ'],
  ENGINEERING_PPIC: [
    'FLOW_READ',
    'FLOW_CREATE',
    'FLOW_LINK',
    'FLOW_VALIDATE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE',
    'STEP_BOM',
    'STEP_PR',
  ],
  PROCUREMENT: [
    'FLOW_READ',
    'FLOW_CREATE',
    'FLOW_LINK',
    'FLOW_VALIDATE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE',
    'DOCUMENT_VOID',
    'ACCURATE_READ',
    'ACCURATE_SYNC',
    'STEP_PR',
    'STEP_PO',
  ],
  IT_PURCHASING: [
    'FLOW_READ',
    'FLOW_CREATE',
    'FLOW_LINK',
    'FLOW_VALIDATE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE',
    'DOCUMENT_VOID',
    'ACCURATE_READ',
    'ACCURATE_SYNC',
    'STEP_PR',
    'STEP_PO',
  ],
  WAREHOUSE: [
    'FLOW_READ',
    'FLOW_LINK',
    'FLOW_VALIDATE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE',
    'ACCURATE_READ',
    'ACCURATE_SYNC',
    'STEP_GRN',
  ],
  FINANCE: [
    'FLOW_READ',
    'FLOW_LINK',
    'FLOW_VALIDATE',
    'APPROVAL_VIEW',
    'APPROVAL_DECIDE',
    'DOCUMENT_VOID',
    'ACCURATE_READ',
    'ACCURATE_SYNC',
    'ACCURATE_PUSH',
    'STEP_PI',
    'STEP_PP',
  ],
};

export interface AuthenticatedSessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  sessionId?: string;
  ipAddress: string;
  displayName: string;
}

export function extractClientIp(request?: Request): string {
  if (!request) return 'unknown';
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function hasPermissions(role: string, required: Permission[]): boolean {
  if (required.length === 0) return true;
  const normalizedRole = (role || 'USER').toUpperCase();
  const granted = ROLE_PERMISSIONS[normalizedRole] || [];
  return required.every((perm) => granted.includes(perm));
}

/**
 * Mengambil dan memverifikasi pengguna yang sedang login dari cookie `auth_session`
 * terhadap database PostgreSQL (`user` dan `userSession`).
 */
export async function getSessionUser(
  request?: Request
): Promise<AuthenticatedSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    if (!sessionCookie?.value) return null;

    let parsed: { email?: string; sessionId?: string } = {};
    try {
      parsed = JSON.parse(sessionCookie.value);
    } catch {
      return null;
    }

    if (!parsed.email || typeof parsed.email !== 'string') {
      return null;
    }

    const user = await db.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return null;
    }

    // Jika sessionId tercatat di cookie, pastikan sesi belum dicabut (revoked) di DB
    if (parsed.sessionId) {
      const activeSession = await db.userSession.findUnique({
        where: { id: parsed.sessionId },
        select: { id: true, userId: true },
      });
      if (!activeSession || activeSession.userId !== user.id) {
        return null;
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      sessionId: parsed.sessionId,
      ipAddress: extractClientIp(request),
      displayName: user.name?.trim() ? `${user.name} (${user.email})` : user.email,
    };
  } catch (err) {
    console.error('[Auth] Gagal memverifikasi session user:', err);
    return null;
  }
}

/**
 * Penjaga Autentikasi & Otorisasi (RBAC) untuk API Route.
 */
export async function requireAuth(
  request?: Request,
  requiredPermissions: Permission[] = []
): Promise<
  | { user: AuthenticatedSessionUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getSessionUser(request);

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: Sesi tidak valid atau sudah berakhir. Silakan login kembali.',
        },
        { status: 401 }
      ),
    };
  }

  if (!hasPermissions(user.role, requiredPermissions)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: `Forbidden: Role "${user.role}" tidak memiliki izin untuk operasi ini (${requiredPermissions.join(', ')}).`,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
