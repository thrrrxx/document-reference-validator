import React, { Suspense } from 'react';
import ReferencesClient from './ReferencesClient';
import { getAllFlowsFromDb } from '@/lib/references-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'References Management | Validex',
  description: 'Explore, review, and validate academic and technical citations.',
};

export default async function ReferencesPage() {
  const initialFlows = await getAllFlowsFromDb();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ReferencesClient initialFlows={initialFlows} />
    </Suspense>
  );
}
