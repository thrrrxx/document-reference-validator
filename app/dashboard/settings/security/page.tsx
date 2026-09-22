import React, { Suspense } from 'react';
import SecuritySettingsClient from '@/components/settings/SecuritySettingsClient';

export const metadata = {
  title: 'Security & Active Sessions | Validex',
  description: 'Manage password, two-factor authentication, active login devices, and audit exports.',
};

export default function SecuritySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SecuritySettingsClient />
    </Suspense>
  );
}
