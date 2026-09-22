import React, { Suspense } from 'react';
import ValidationRateClient from '@/components/analytics/ValidationRateClient';

export const metadata = {
  title: 'Validation Rate & Failure Analysis | Validex',
  description: 'Deep dive into citation validation rates, failure drivers, and confidence distribution.',
};

export default function ValidationRatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ValidationRateClient />
    </Suspense>
  );
}
