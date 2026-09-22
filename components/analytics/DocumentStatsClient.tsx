'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  FileCheck2,
  Clock,
  Search,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';
import AnalyticsHeader from './AnalyticsHeader';
import { MOCK_DOCUMENT_STATS, DocumentStatItem } from '@/lib/mock-analytics';

export default function DocumentStatsClient() {
  const [timeRange, setTimeRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const filteredDocs = useMemo(() => {
    return MOCK_DOCUMENT_STATS.filter((doc) => {
      if (selectedFormat !== 'all' && doc.fileType.toLowerCase() !== selectedFormat.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return doc.title.toLowerCase().includes(q) || doc.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchQuery, selectedFormat]);

  const fileFormatStats = [
    { type: 'PDF', count: 19, share: 67.8, color: '#3B82F6', avgProcessingSec: 2.8 },
    { type: 'DOCX', count: 7, share: 25.0, color: '#10B981', avgProcessingSec: 1.6 },
    { type: 'LaTeX', count: 2, share: 7.2, color: '#8B5CF6', avgProcessingSec: 1.1 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <AnalyticsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        title="Document Intelligence & Processing Stats"
        description="Granular performance, citation density, and health scores across ingested documents."
      />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">28</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+4 this month</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active documents analyzed in workspace
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Avg Citations / Doc
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">44.5</span>
              <span className="text-xs text-gray-500">references</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Highest: 184 (Medical Submission)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Avg Document Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">93.8</span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Weighted composite quality score
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Processing Velocity
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">2.4s</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">per file</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Parsing, OCR, and citation extraction
            </p>
          </div>
        </div>
      </div>

      {/* 3. Ingestion Format Breakdown */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
          Document File Format Distribution
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Distribution of uploaded manuscript formats and average extraction time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {fileFormatStats.map((fmt) => (
            <div
              key={fmt.type}
              className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-white">{fmt.type} Documents</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${fmt.color}20`, color: fmt.color }}>
                  {fmt.share}%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{fmt.count} files</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                <span>Avg Extraction Latency</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt.avgProcessingSec}s</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-1.5 rounded-full" style={{ width: `${fmt.share}%`, backgroundColor: fmt.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top Document Citation Ranking Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document title or ID..."
              className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-400 font-medium">Format:</span>
            {['all', 'pdf', 'docx', 'latex'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition ${
                  selectedFormat === fmt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Type & Size</th>
                <th className="px-6 py-3.5">Citations</th>
                <th className="px-6 py-3.5">Validation Rate</th>
                <th className="px-6 py-3.5">Health Score</th>
                <th className="px-6 py-3.5">Processing Time</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="truncate max-w-xs sm:max-w-sm">{doc.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">{doc.id} • Updated {doc.updatedAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {doc.fileType}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1.5">{doc.fileSize}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    {doc.referenceCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          doc.validationRate >= 95
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : doc.validationRate >= 90
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {doc.validationRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${doc.healthScore}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white text-[11px]">{doc.healthScore}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {doc.processingTimeSec}s
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/documents`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Inspect <ArrowUpRight className="w-3.5 h-3.5" />
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
