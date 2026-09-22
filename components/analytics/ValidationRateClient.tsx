'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Sliders,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import AnalyticsHeader from './AnalyticsHeader';
import {
  MOCK_CATEGORY_ACCURACY,
  MOCK_FAILURE_REASONS
} from '@/lib/mock-analytics';

export default function ValidationRateClient() {
  const [timeRange, setTimeRange] = useState('30d');

  const confidenceBrackets = [
    { bracket: '95 - 100%', count: 912, percentage: 73.1, color: '#10B981', label: 'High Confidence (Instant Match)' },
    { bracket: '80 - 94%', count: 268, percentage: 21.5, color: '#3B82F6', label: 'Good Match (Minor Discrepancy)' },
    { bracket: '60 - 79%', count: 42, percentage: 3.4, color: '#F59E0B', label: 'Review Needed (Ambiguous DOI)' },
    { bracket: '< 60%', count: 26, percentage: 2.0, color: '#EF4444', label: 'Unresolvable / Broken Reference' },
  ];

  const categoryBarData = MOCK_CATEGORY_ACCURACY.map((c) => ({
    name: c.category.split(' ')[0],
    fullName: c.category,
    Valid: c.valid,
    Failed: c.failed,
    rate: c.rate,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <AnalyticsHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        title="Validation Rate & Accuracy Analysis"
        description="Detailed telemetry into confidence distributions, failure drivers, and citation compliance."
      />

      {/* 2. Top Summary Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Overall Accuracy</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">94.5%</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+1.8% vs Q2</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            1,180 verified citations matched against Crossref, IEEE, and PubMed registers.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Average Confidence</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">96.2%</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Optimal</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Algorithm title/author string distance score across all positive matches.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Failure Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">4.5%</span>
                <span className="text-xs font-semibold text-rose-600">56 Citations</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            42.8% of broken citations stem from dead or moved DOI links.
          </p>
        </div>
      </div>

      {/* 3. Category Validation Rate Breakdown Chart */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Citations Volume & Verification by Category
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparison between verified valid citations vs failed issues per document category.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">Valid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-gray-600 dark:text-gray-400">Failed</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="Valid" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Failed" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two Columns: Failure Reasons Analysis & Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Failure Drivers */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Primary Causes for Citation Failure
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Breakdown of 56 failed references by root issue.
                </p>
              </div>
              <Link
                href="/dashboard/references?status=failed"
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                Inspect All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4 mt-5">
              {MOCK_FAILURE_REASONS.map((reason) => (
                <div key={reason.reason} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">
                      {reason.reason}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-gray-400">{reason.count} cases</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          reason.impactLevel === 'critical'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : reason.impactLevel === 'moderate'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {reason.impactLevel}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white w-10 text-right">
                        {reason.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        reason.impactLevel === 'critical'
                          ? 'bg-rose-500'
                          : reason.impactLevel === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${reason.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Resolving the top 2 failure causes will increase total validation rate past 98.2%.</span>
          </div>
        </div>

        {/* Right: Confidence Score Distribution */}
        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Confidence Score Histogram
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Algorithm confidence distribution across citations.
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-5">
              {confidenceBrackets.map((bracket) => (
                <div
                  key={bracket.bracket}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/30"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bracket.color }} />
                      <span className="font-bold text-gray-900 dark:text-white">{bracket.bracket}</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:inline">
                        — {bracket.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{bracket.count} refs</span>
                      <span className="font-bold text-gray-900 dark:text-white">{bracket.percentage}%</span>
                    </div>
                  </div>
                  <div className="mt-2.5 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bracket.percentage}%`, backgroundColor: bracket.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              94.6% of Citations Require Zero Manual Review
            </h4>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              Citations with &gt;=80% match confidence are verified automatically against authoritative registries with zero human intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
