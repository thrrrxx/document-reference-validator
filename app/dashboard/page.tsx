import React from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileCheck,
  FileWarning,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import { MOCK_REFERENCES } from '@/lib/mock-references';

export default function DashboardPage() {
  const totalCount = MOCK_REFERENCES.length;
  const missingCount = MOCK_REFERENCES.filter((r) => r.status === 'missing').length;
  const completeCount = MOCK_REFERENCES.filter((r) => r.status === 'complete').length;

  const stats = [
    {
      title: 'All Document',
      value: String(totalCount),
      subtitle: 'Alur lengkap & tidak lengkap',
      change: '100% alur terpantau',
      changeType: 'positive',
      icon: Layers,
      color: 'blue',
      href: '/dashboard/references',
    },
    {
      title: 'Missing',
      value: String(missingCount),
      subtitle: 'Alur dokumen yang kurang',
      change: 'Perlu tindakan kelengkapan (e.g. PO tanpa PR)',
      changeType: 'warning',
      icon: FileWarning,
      color: 'amber',
      href: '/dashboard/references?status=missing',
      badge: 'Action Needed',
    },
    {
      title: 'Complete',
      value: String(completeCount),
      subtitle: 'Alur dokumen sudah lengkap',
      change: 'Terverifikasi BOM → PR → PO → GRN → PI → PP',
      changeType: 'positive',
      icon: FileCheck,
      color: 'emerald',
      href: '/dashboard/references?status=complete',
      badge: '100% Valid',
    },
  ];

  const recentFlows = MOCK_REFERENCES.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs transition-colors duration-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/references"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <Layers className="w-4 h-4" />
            <span>Lihat Semua Alur Dokumen</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </span>
                  <div
                    className={`p-2.5 rounded-xl ${stat.color === 'blue'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : stat.color === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Alur Dokumen</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {stat.subtitle}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
                <span
                  className={
                    stat.changeType === 'warning'
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-emerald-600 dark:text-emerald-400 font-medium'
                  }
                >
                  {stat.change}
                </span>
                <span className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Action Attention Banner for Missing Flows */}
      {missingCount > 0 && (
        <div className="p-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
              <h3 className="font-bold text-lg">Peringatan: {missingCount} Alur Dokumen Memerlukan Tindakan</h3>
            </div>
          </div>
          <div>
            <Link
              href="/dashboard/references?status=missing"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shadow-sm whitespace-nowrap"
            >
              <span>Periksa Alur Missing ({missingCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 4. Recent Flow Validations Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Validasi Alur Dokumen Terbaru</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Rangkaian alur pengadaan & pemenuhan dokumen terkini</p>
          </div>
          <Link
            href="/dashboard/references"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>Lihat Semua Alur</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3">ID Alur & Paket Pengadaan</th>
                <th className="px-6 py-3">Vendor Rekanan</th>
                <th className="px-6 py-3">Alur Dokumen (Pipeline)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-normal">
              {recentFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4 max-w-xs">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{flow.title}</div>
                    <div className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 mt-0.5">{flow.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{flow.vendor}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{flow.totalAmount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {flow.flowSteps.map((step, idx) => (
                        <React.Fragment key={step.code}>
                          {idx > 0 && <span className="text-gray-400 text-xs">→</span>}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${step.status === 'present'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-dashed border-rose-300 dark:border-rose-800'
                              }`}
                          >
                            {step.code}
                            {step.status === 'missing' && ' ✕'}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {flow.status === 'complete' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Complete</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Missing</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/references?status=${flow.status}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      Detail Alur
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
