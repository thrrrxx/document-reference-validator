import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Dashboard | Validex Document Reference Validator',
  description: 'Manage and validate document references with confidence',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
