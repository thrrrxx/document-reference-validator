'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  X,
  ShieldCheck,
  Bell
} from 'lucide-react';

interface SubItem {
  name: string;
  path: string;
  badge?: number;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: SubItem[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Home',
    path: '/dashboard',
    icon: Home,
  },
  {
    name: 'References',
    path: '/dashboard/references',
    icon: Search,
    badge: 12,
    subItems: [
      { name: 'All References', path: '/dashboard/references' },
      { name: 'Pending Review', path: '/dashboard/references?status=pending', badge: 12 },
      { name: 'Valid', path: '/dashboard/references?status=valid' },
      { name: 'Failed', path: '/dashboard/references?status=failed' },
    ],
  },
  {
    name: 'Documents',
    path: '/dashboard/documents',
    icon: FileText,
    subItems: [
      { name: 'All Documents', path: '/dashboard/documents' },
      { name: 'Recent', path: '/dashboard/documents?sort=recent' },
      { name: 'Trash', path: '/dashboard/documents?view=trash' },
    ],
  },
  {
    name: 'Analytics',
    path: '/dashboard/analytics',
    icon: BarChart3,
    subItems: [
      { name: 'Overview', path: '/dashboard/analytics' },
      { name: 'Validation Rate', path: '/dashboard/analytics/validation-rate' },
      { name: 'Document Stats', path: '/dashboard/analytics/document-stats' },
      { name: 'Export Reports', path: '/dashboard/analytics/export' },
    ],
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    subItems: [
      { name: 'Profile', path: '/dashboard/settings/profile' },
      { name: 'Preferences', path: '/dashboard/settings/preferences' },
      { name: 'API Keys', path: '/dashboard/settings/api-keys' },
      { name: 'Security', path: '/dashboard/settings/security' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarNavInner({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    References: true, // Default open References as primary focus
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Combine pathname and search string to match full query paths
  const currentFullPath = searchParams?.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  // Auto-expand item if current path matches any sub-item
  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some((sub) => {
          if (sub.path.includes('?')) {
            return currentFullPath === sub.path;
          }
          return pathname === sub.path;
        });
        if (isChildActive) {
          setExpandedItems((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname, currentFullPath]);

  // Read saved expanded state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_state');
      if (saved) {
        setExpandedItems((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) => {
      const next = { ...prev, [itemName]: !prev[itemName] };
      try {
        localStorage.setItem('sidebar_expanded_state', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isSubItemActive = (subPath: string) => {
    if (subPath.includes('?')) {
      return currentFullPath === subPath;
    }
    // Exact match for base path without query params
    return pathname === subPath && (!searchParams || searchParams.toString() === '');
  };

  const isParentActive = (item: NavItem) => {
    if (item.path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(item.path);
  };

  const handleSignOut = () => {
    // Redirect to login
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">
      {/* 1. Header / Logo Area */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-200 group-hover:bg-blue-700 transition">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">Validex</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium tracking-tight">Validate. Organize. Trust.</span>
          </div>
        </Link>
        {/* Close Button for Mobile */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Scrollable Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Main Navigation
        </div>

        {navigationItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.subItems && item.subItems.length > 0);
          const isExpanded = Boolean(expandedItems[item.name]);
          const parentActive = isParentActive(item);

          return (
            <div key={item.name} className="space-y-1">
              {hasChildren ? (
                <div
                  className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer select-none ${
                    parentActive
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => toggleExpand(item.name)}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition ${
                        parentActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-gray-400 dark:text-gray-500 transition-transform duration-200">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href={item.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    parentActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-600 dark:border-blue-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        parentActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub-items accordion */}
              {hasChildren && isExpanded && (
                <div className="pl-9 pr-2 py-1 space-y-1 transition-all">
                  {item.subItems?.map((sub) => {
                    const active = isSubItemActive(sub.path);
                    return (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-500'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 3. Divider & Secondary items */}
        <div className="pt-4 pb-2">
          <div className="border-t border-gray-100 dark:border-gray-800/80" />
        </div>

        <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Support
        </div>

        <Link
          href="/dashboard/help"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            pathname.startsWith('/dashboard/help')
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold border-l-4 border-blue-600 dark:border-blue-500'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <span>Help & Support</span>
        </Link>
      </nav>

      {/* 4. User Profile Section & Dropdown */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 flex-shrink-0 relative">
        {/* Dropdown Popover */}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-[#1E293B] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700/80 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3.5 py-2 border-b border-gray-100 dark:border-gray-700/80">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">Signed in as</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">john@company.com</p>
            </div>

            <Link
              href="/dashboard/settings/profile"
              onClick={() => {
                setIsProfileMenuOpen(false);
                onClose();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white transition"
            >
              <User className="w-4 h-4 text-gray-400 dark:text-gray-400" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => {
                setIsProfileMenuOpen(false);
                onClose();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white transition"
            >
              <Settings className="w-4 h-4 text-gray-400 dark:text-gray-400" />
              <span>Settings</span>
            </Link>

            <div className="border-t border-gray-100 dark:border-gray-700/80 my-1" />

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition text-left"
            >
              <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Profile Card / Trigger */}
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition text-left"
          aria-expanded={isProfileMenuOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
              JD
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">John Doe</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">john@company.com</p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              isProfileMenuOpen ? 'rotate-180 text-gray-600 dark:text-gray-300' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Persistent Sidebar (Fixed 280px on desktop) */}
      <aside className="hidden lg:block w-[280px] h-screen sticky top-0 flex-shrink-0 z-30">
        <Suspense
          fallback={
            <div className="w-[280px] h-screen bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-800 p-6">
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
              <div className="space-y-3">
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>
          }
        >
          <SidebarNavInner onClose={onClose} />
        </Suspense>
      </aside>

      {/* Mobile Backdrop & Drawer (<lg screens) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-white dark:bg-[#0F172A] border-r border-gray-200 dark:border-gray-800 z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Suspense
          fallback={
            <div className="w-full h-full bg-white dark:bg-[#0F172A] p-6">
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
            </div>
          }
        >
          <SidebarNavInner onClose={onClose} />
        </Suspense>
      </aside>
    </>
  );
}
