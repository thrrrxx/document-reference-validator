import React, { Suspense } from 'react';
import DocumentStatsClient from '@/components/analytics/DocumentStatsClient';

export const metadata = {
  title: 'Document Intelligence & Stats | Validex',
  description: 'Detailed citation density, processing speeds, and health metrics by document.',
};

export default function DocumentStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <DocumentStatsClient />
    </Suspense>
  );
}
