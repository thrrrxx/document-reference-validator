import React, { Suspense } from 'react';
import DocumentsClient from './DocumentsClient';

export const metadata = {
  title: 'Document Management | Validex',
  description: 'Upload, manage, and inspect documents for reference validation.',
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DocumentsClient />
    </Suspense>
  );
}
