'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  Calendar,
  Filter,
  Clock,
  Sparkles,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';
import AnalyticsHeader from './AnalyticsHeader';
import { MOCK_EXPORT_REPORTS, GeneratedReport } from '@/lib/mock-analytics';

export default function ExportReportsClient() {
  const [timeRange, setTimeRange] = useState('30d');
  const [reportType, setReportType] = useState<GeneratedReport['type']>('Executive Summary');
  const [reportFormat, setReportFormat] = useState<'CSV' | 'PDF' | 'JSON'>('PDF');
  const [includePending, setIncludePending] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>(MOCK_EXPORT_REPORTS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: `REP-${Math.floor(100 + Math.random() * 900)}`,
        name: `Validex_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${reportFormat.toLowerCase()}`,
        type: reportType,
        format: reportFormat,
        size: reportFormat === 'JSON' ? '2.8 MB' : reportFormat === 'PDF' ? '1.5 MB' : '380 KB',
        dateRange: timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days',
        generatedAt: 'Just now',
        downloadUrl: '#',
      };

      setReports((prev) => [newReport, ...prev]);
      setIsGenerating(false);
      showToast(`Report "${newReport.name}" generated successfully!`);
    }, 1200);
  };

  const handleDownload = (report: GeneratedReport) => {
    showToast(`Downloading ${report.name} (${report.size})...`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl border border-gray-700 dark:border-gray-200 animate-in fade-in slide-in-from-bottom-4 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <AnalyticsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        title="Export Analytics & Audit Reports"
        description="Generate compliance-ready citation audit logs, failure manifests, and executive summaries."
      />

      {/* 2. Main Generator Card */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Custom Report Generator
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select dataset scope, output formats, and parameters.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateReport} className="space-y-6">
          {/* Step 1: Report Scope */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              1. Select Report Content
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  type: 'Executive Summary' as const,
                  desc: 'High-level KPIs, validation rates, and registry health.',
                },
                {
                  type: 'Broken References' as const,
                  desc: 'Actionable list of all 404, 410, and metadata errors.',
                },
                {
                  type: 'Full Audit Log' as const,
                  desc: 'Every extracted citation with confidence & Crossref DOI.',
                },
                {
                  type: 'Citation Coverage' as const,
                  desc: 'Document-by-document density and validation metrics.',
                },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setReportType(item.type)}
                  className={`p-4 rounded-xl border text-left transition ${
                    reportType === item.type
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-white ring-1 ring-blue-600'
                      : 'border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <span className="font-bold text-xs block text-gray-900 dark:text-white">
                    {item.type}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Format & Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Format Selection */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                2. Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { format: 'PDF' as const, icon: FileText, desc: 'Formatted Print' },
                  { format: 'CSV' as const, icon: FileSpreadsheet, desc: 'Spreadsheet' },
                  { format: 'JSON' as const, icon: FileCode, desc: 'Raw API Data' },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => setReportFormat(f.format)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                        reportFormat === f.format
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{f.format}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scope Date Range */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                3. Date Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-xs px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="7d">Last 7 Days (16 Sep - 22 Sep 2026)</option>
                <option value="30d">Last 30 Days (Aug 23 - Sep 22 2026)</option>
                <option value="90d">Last 90 Days (Q3 2026)</option>
                <option value="1y">Year to Date (2026 Full Year)</option>
              </select>
            </div>

            {/* Inclusions */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                4. Data Filtering
              </label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={includePending}
                    onChange={(e) => setIncludePending(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include Pending / Unverified Citations</span>
                </label>
                <p className="text-[11px] text-gray-400">
                  Author names and DOI registry URLs will be included in separate columns.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Ready for Download</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Recent Downloadable Reports Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Generated Reports Archive
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Instant download links for historical exports.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {reports.length} Reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Report Filename</th>
                <th className="px-6 py-3.5">Report Type</th>
                <th className="px-6 py-3.5">Format</th>
                <th className="px-6 py-3.5">Date Range</th>
                <th className="px-6 py-3.5">Generated At</th>
                <th className="px-6 py-3.5 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{rep.name}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">{rep.id} • {rep.size}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                    {rep.type}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rep.format === 'PDF'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : rep.format === 'CSV'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {rep.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {rep.dateRange}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {rep.generatedAt}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownload(rep)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Download</span>
                    </button>
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
