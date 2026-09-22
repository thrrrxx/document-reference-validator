import React, { Suspense } from 'react';
import ProfileSettingsClient from '@/components/settings/ProfileSettingsClient';

export const metadata = {
  title: 'Profile Settings | Validex',
  description: 'Manage personal profile, validator credentials, and workspace identity.',
};

export default function ProfileSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ProfileSettingsClient />
    </Suspense>
  );
}
