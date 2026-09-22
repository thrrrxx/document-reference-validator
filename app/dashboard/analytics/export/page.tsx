import React, { Suspense } from 'react';
import ExportReportsClient from '@/components/analytics/ExportReportsClient';

export const metadata = {
  title: 'Export Reports & Audit Logs | Validex',
  description: 'Download custom citation validation audit logs, CSV exports, and executive summaries.',
};

export default function ExportReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ExportReportsClient />
    </Suspense>
  );
}
