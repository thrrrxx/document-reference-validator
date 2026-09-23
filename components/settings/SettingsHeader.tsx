'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Settings,
  Sparkles
} from 'lucide-react';

interface SettingsHeaderProps {
  title: string;
  description: string;
}

export default function SettingsHeader({ title, description }: SettingsHeaderProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Profile',
      path: '/dashboard/settings/profile',
      icon: User,
      // Matches both /dashboard/settings/profile and root /dashboard/settings
      isActive: pathname === '/dashboard/settings/profile' || pathname === '/dashboard/settings',
    },
    {
      name: 'Security',
      path: '/dashboard/settings/security',
      icon: ShieldCheck,
      isActive: pathname === '/dashboard/settings/security',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Settings className="w-3 h-3" />
              Workspace Controls
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </div>

      {/* Settings Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                tab.isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-200 dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
