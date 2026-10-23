import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import ProfileSettingsClient from '@/components/settings/ProfileSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Profile Settings | Validex',
  description: 'Manage personal profile, validator credentials, and workspace identity.',
};

async function getDbUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');
    let email: string | null = null;
    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        email = session.email;
      } catch {
        // ignore
      }
    }
    let user = null;
    if (email) {
      user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    }
    if (!user) {
      user = await db.user.findFirst({ orderBy: { createdAt: 'desc' } });
    }
    if (user) {
      try {
        const rows = await db.$queryRawUnsafe<{ image: string | null }[]>(
          'SELECT "image" FROM "user" WHERE "id" = $1 LIMIT 1',
          user.id
        );
        return { ...user, image: rows?.[0]?.image || null };
      } catch {
        return { ...user, image: null };
      }
    }
    return null;
  } catch (err) {
    console.error('[ProfileSettingsPage] Failed to load user:', err);
    return null;
  }
}


export default async function ProfileSettingsPage() {
  const user = await getDbUser();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ProfileSettingsClient
        initialUser={
          user
            ? {
                id: user.id,
                name: user.name || '',
                email: user.email,
                role: user.role,
                image: (user as any).image || null,
                createdAt: user.createdAt.toISOString(),
              }
            : null

        }
      />
    </Suspense>
  );
}

