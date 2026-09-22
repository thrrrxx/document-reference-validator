'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Database,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Activity,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import AnalyticsHeader from './AnalyticsHeader';
import {
  MOCK_TREND_DATA,
  MOCK_MONTHLY_TREND,
  MOCK_CATEGORY_ACCURACY,
  MOCK_REGISTRY_STATS
} from '@/lib/mock-analytics';

export default function AnalyticsOverviewClient() {
  const [timeRange, setTimeRange] = useState('30d');

  const trendData = timeRange === '7d' ? MOCK_TREND_DATA : MOCK_MONTHLY_TREND;

  return (
    <div className="space-y-6">
      {/* 1. Header with Tabs & Filters */}
      <AnalyticsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        title="Analytics & Accuracy Overview"
        description="Comprehensive breakdown of document citations, validation reliability, and external registry health."
      />

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Validation Rate */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Overall Validation Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">94.5%</span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +1.8%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Surpasses industry target (90.0%)
            </p>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94.5%' }} />
          </div>
        </div>

        {/* KPI 2: Total Citations */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Citations Processed
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">1,248</span>
              <span className="text-xs font-medium text-gray-500">across 28 docs</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              1,180 Verified • 12 Pending • 56 Broken
            </p>
          </div>
          <div className="mt-3 flex gap-1 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500" style={{ width: '94.5%' }} title="Valid" />
            <div className="bg-amber-400" style={{ width: '1.0%' }} title="Pending" />
            <div className="bg-rose-500" style={{ width: '4.5%' }} title="Failed" />
          </div>
        </div>

        {/* KPI 3: Registry Latency */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Avg Lookup Latency
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">320ms</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                -45ms faster
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Crossref & PubMed API response average
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
            <span>Fastest: 180ms</span>
            <span>99th percentile: 680ms</span>
          </div>
        </div>

        {/* KPI 4: Broken Citations */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Broken Citations
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">56</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">
                4.5% of total
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              24 DOIs with 404/410, 14 author mismatches
            </p>
          </div>
          <div className="mt-3">
            <Link
              href="/dashboard/references?status=failed"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
            >
              Resolve failed references <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Chart: Verification Trend Over Time */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Citation Verification Volume & Reliability Trend
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historical view of successfully verified vs pending vs failed reference citations.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">Valid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span className="text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-gray-600 dark:text-gray-400">Failed</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="validGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="valid"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#validGradient)"
                name="Valid Citations"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#failedGradient)"
                name="Failed Citations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two Column Insights: Registry Performance & Category Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Registry Health & Latency */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Citation Registry Verification Health
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Resolution success rate and latency across external catalogs.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                All 5 Online
              </span>
            </div>

            <div className="space-y-3.5 mt-4">
              {MOCK_REGISTRY_STATS.map((reg) => (
                <div key={reg.source} className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-gray-200">
                    <span>{reg.source}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{reg.successRate}% Success</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>{reg.queries} queries</span>
                    <span>Avg latency: {reg.avgLatencyMs}ms</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${reg.successRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Accuracy by Citation Category */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Accuracy Breakdown by Category
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Comparison of validity across different citation media.
                </p>
              </div>
              <Link
                href="/dashboard/analytics/validation-rate"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Deep Dive <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 mt-4">
              {MOCK_CATEGORY_ACCURACY.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[11px]">{cat.valid} of {cat.total} valid</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{cat.rate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  Journal Articles Lead Accuracy at 96.6%
                </h4>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                  Standardized DOI indexing enables instant Crossref matching. Technical Reports have the highest failure risk (89.1%) due to non-persistent URL links.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
