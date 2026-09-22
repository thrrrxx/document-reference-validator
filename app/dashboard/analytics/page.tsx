import React, { Suspense } from 'react';
import AnalyticsOverviewClient from '@/components/analytics/AnalyticsOverviewClient';

export const metadata = {
  title: 'Analytics Overview | Validex',
  description: 'Track citation validation rates, accuracy trends, and external registry performance.',
};

export default function AnalyticsOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AnalyticsOverviewClient />
    </Suspense>
  );
}
