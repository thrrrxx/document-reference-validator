import React, { Suspense } from 'react';
import ApiKeysSettingsClient from '@/components/settings/ApiKeysSettingsClient';

export const metadata = {
  title: 'API Keys & Developer Integrations | Validex',
  description: 'Manage API tokens for automated citation verification and external webhooks.',
};

export default function ApiKeysPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ApiKeysSettingsClient />
    </Suspense>
  );
}
