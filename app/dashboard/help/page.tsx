import React, { Suspense } from 'react';
import HelpSupportClient from '@/components/help/HelpSupportClient';

export const metadata = {
  title: 'Help & Support Center | Validex',
  description: 'Search documentation, explore citation FAQs, troubleshoot broken DOIs, and submit support inquiries.',
};

export default function HelpSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <HelpSupportClient />
    </Suspense>
  );
}
