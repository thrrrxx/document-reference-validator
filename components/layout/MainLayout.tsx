'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, User, CheckCircle2 } from 'lucide-react';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* 1. Sidebar Component (Desktop sticky & Mobile Drawer) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs transition-colors duration-200">
          {/* Left section: Hamburger (Mobile) + Global Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search references, documents, or tags..."
                className="w-full bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-10 pr-12 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-400 bg-gray-200/60 dark:bg-gray-700/60 rounded border border-gray-300/50 dark:border-gray-600/50">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right section: System Status, ThemeToggle, Notifications & Profile Shortcut */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Validator Online</span>
            </div>

            {/* Theme Toggle Button (Light/Dark Mode) */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0F172A]" />
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 sm:mx-1 hidden sm:block" />

            {/* Quick Profile Icon link */}
            <Link
              href="/dashboard/settings/profile"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
              title="View profile settings"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition">
                JD
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
