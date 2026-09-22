import React, { Suspense } from 'react';
import PreferencesSettingsClient from '@/components/settings/PreferencesSettingsClient';

export const metadata = {
  title: 'Validation Preferences | Validex',
  description: 'Customize automated validation thresholds, registry querying, and alerting options.',
};

export default function PreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PreferencesSettingsClient />
    </Suspense>
  );
}
