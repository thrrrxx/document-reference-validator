import React, { Suspense } from 'react';
import ProfileSettingsClient from '@/components/settings/ProfileSettingsClient';

export const metadata = {
  title: 'Settings | Validex',
  description: 'Manage profile credentials, preferences, API keys, and workspace security.',
};

export default function SettingsPage() {
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
