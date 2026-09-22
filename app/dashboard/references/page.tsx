import React, { Suspense } from 'react';
import ReferencesClient from './ReferencesClient';

export const metadata = {
  title: 'References Management | Validex',
  description: 'Explore, review, and validate academic and technical citations.',
};

export default function ReferencesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ReferencesClient />
    </Suspense>
  );
}
