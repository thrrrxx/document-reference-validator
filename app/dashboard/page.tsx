import React from 'react';
import Link from 'next/link';
import {
  Search,
  FileCheck2,
  Clock,
  AlertTriangle,
  FileUp,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total References',
      value: '1,248',
      change: '+14% from last month',
      changeType: 'positive',
      icon: Search,
      color: 'blue',
      href: '/dashboard/references',
    },
    {
      title: 'Pending Review',
      value: '12',
      change: 'High priority actions needed',
      changeType: 'warning',
      icon: Clock,
      color: 'amber',
      href: '/dashboard/references?status=pending',
      badge: 'Needs Review',
    },
    {
      title: 'Valid References',
      value: '1,180',
      change: '94.5% accuracy rate',
      changeType: 'positive',
      icon: CheckCircle2,
      color: 'emerald',
      href: '/dashboard/references?status=valid',
    },
    {
      title: 'Failed / Broken',
      value: '56',
      change: 'Requires citation fixes',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'rose',
      href: '/dashboard/references?status=failed',
    },
  ];

  const recentReferences = [
    {
      id: 'REF-8921',
      title: 'IEEE Trans. Pattern Anal. Mach. Intell. - Deep Residual Learning',
      document: 'Annual_AI_Research_Report_2026.pdf',
      status: 'valid',
      date: '10 mins ago',
    },
    {
      id: 'REF-8920',
      title: 'ISO/IEC 27001:2022 Security Management Framework Guidelines',
      document: 'Enterprise_Compliance_Doc_v4.docx',
      status: 'pending',
      date: '35 mins ago',
    },
    {
      id: 'REF-8919',
      title: 'NIST Special Publication 800-53 Rev. 5 Access Control Models',
      document: 'Security_Architecture_Blueprint.pdf',
      status: 'valid',
      date: '2 hours ago',
    },
    {
      id: 'REF-8918',
      title: 'WHO Technical Report Series No. 986 - Annex 2 Good Practices',
      document: 'Medical_Device_Submission_Draft.pdf',
      status: 'failed',
      date: 'Yesterday',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs transition-colors duration-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor document reference integrity, pending validations, and automated reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>Browse Documents</span>
          </Link>
          <Link
            href="/dashboard/references"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <FileUp className="w-4 h-4" />
            <span>Validate New Reference</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/40 hover:shadow-md transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {item.title}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 flex items-center justify-center transition">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {item.value}
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span
                  className={
                    item.changeType === 'positive'
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                      : item.changeType === 'warning'
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-rose-600 dark:text-rose-400 font-medium'
                  }
                >
                  {item.change}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Focus Section: Pending References Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Attention Required</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            12 References Awaiting Verification
          </h2>
          <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
            Several citations require manual review due to DOI link modifications or source publisher updates. Review them now to ensure full document compliance.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/references?status=pending"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition shadow-sm"
            >
              <span>Review Pending References (12)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Reference Validations Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Validations</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest scanned citations across your uploaded documents</p>
          </div>
          <Link
            href="/dashboard/references"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3">Reference ID & Title</th>
                <th className="px-6 py-3">Source Document</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Validated</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-normal">
              {recentReferences.map((ref) => (
                <tr key={ref.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{ref.title}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ref.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="truncate max-w-xs">{ref.document}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ref.status === 'valid' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Valid</span>
                      </span>
                    )}
                    {ref.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Pending</span>
                      </span>
                    )}
                    {ref.status === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Failed</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {ref.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/references?status=${ref.status}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                    >
                      Inspect
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
