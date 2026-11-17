'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Clock,
  AlertOctagon,
  PackageCheck,
  FileWarning,
  Download,
  ShieldAlert,
  CheckSquare,
} from 'lucide-react';
import type { ExecutiveAnalyticsData } from '@/lib/analytics-service';

interface ExecutiveAnalyticsPanelProps {
  data: ExecutiveAnalyticsData;
}

function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExecutiveAnalyticsPanel({ data }: ExecutiveAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<'exceptions' | 'grni' | 'aging'>('exceptions');

  const maxHours = Math.max(...data.leadTimeMetrics.map((m) => m.avgHours), 0);

  return (
    <div className="space-y-6">
      {/* 1. Executive ERP Risk & Operations Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Executive ERP Analytics & Bottleneck Monitor
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pemantauan waktu siklus pengadaan, akrual GRNI, aging Open PO, dan antrean exception.
          </p>
        </div>
        <a
          href="/api/export"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-xs w-fit"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Ekspor Laporan Audit (CSV)</span>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>PENDING APPROVALS</span>
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.pendingApprovals}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Task persetujuan berjenjang aktif
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>OPEN PO (BELUM GR)</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.openPoCount}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            {data.poAgingBuckets['>30d']} PO berumur &gt; 30 hari
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>GRNI (UNBILLED GR)</span>
            <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.grniCount}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Estimasi akrual: {formatIdr(data.summary.grniEstimatedValueIdr)}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>EXCEPTION QUEUE</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.exceptionCount}
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
            Selisih 3-Way Match / Overpayment
          </p>
        </div>
      </div>

      {/* 2. Lead-Time Bottleneck Chart & PO Aging Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Lead-Time Bottleneck per Tahap P2P (Jam)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Rata-rata durasi transisi antar dokumen berdasarkan tanggal dokumen
              </p>
            </div>
            {data.summary.bottleneckStage && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800/60">
                <FileWarning className="w-3.5 h-3.5" />
                Bottleneck: {data.summary.bottleneckStage}
              </span>
            )}
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadTimeMetrics} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: unknown) => [`${value} jam`, 'Rata-rata Durasi']}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '12px',
                    borderColor: '#CBD5E1',
                  }}
                />
                <Bar dataKey="avgHours" radius={[6, 6, 0, 0]}>
                  {data.leadTimeMetrics.map((entry) => (
                    <Cell
                      key={entry.transition}
                      fill={maxHours > 0 && entry.avgHours === maxHours ? '#F59E0B' : '#2563EB'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Open PO Aging Buckets */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Open PO Aging</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Distribusi umur PO yang belum memiliki penerimaan barang (GR)
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: '0-7d' as const, label: '0 – 7 Hari (Normal)', color: 'bg-emerald-500' },
              { key: '8-14d' as const, label: '8 – 14 Hari (Pantau)', color: 'bg-blue-500' },
              { key: '15-30d' as const, label: '15 – 30 Hari (Terlambat)', color: 'bg-amber-500' },
              { key: '>30d' as const, label: '> 30 Hari (Kritis)', color: 'bg-rose-500' },
            ].map((bucket) => {
              const count = data.poAgingBuckets[bucket.key];
              const pct =
                data.summary.openPoCount > 0
                  ? Math.round((count / data.summary.openPoCount) * 100)
                  : 0;
              return (
                <div key={bucket.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{bucket.label}</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {count} PO ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bucket.color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Actionable Audit Tabs: Exception Queue | GRNI | Open PO Detail */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2">
          {[
            { id: 'exceptions' as const, label: `Exception Queue (${data.exceptionQueue.length})` },
            { id: 'grni' as const, label: `Unbilled GR / GRNI (${data.grniList.length})` },
            { id: 'aging' as const, label: `Open PO Aging (${data.openPoList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'exceptions' && (
            data.exceptionQueue.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tidak ada pelanggaran validasi (`INVALID` / `WARNING`) saat ini.
              </p>
            ) : (
              <div className="space-y-2.5">
                {data.exceptionQueue.map((item) => (
                  <div
                    key={item.relationId}
                    className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert
                          className={`w-4 h-4 ${
                            item.validationStatus === 'INVALID' ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                          {item.sourceType} ({item.sourceNumber}) → {item.targetType} ({item.targetNumber})
                        </span>
                        {item.flowId && (
                          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                            [{item.flowId}]
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        {item.discrepancy || 'Memerlukan pemeriksaan manual oleh tim audit.'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold self-start sm:self-center ${
                        item.validationStatus === 'INVALID'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.validationStatus}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'grni' && (
            data.grniList.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seluruh penerimaan barang (GR) sudah ditagihkan pada Purchase Invoice.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="py-2 pr-4 font-semibold">No. GR</th>
                      <th className="py-2 pr-4 font-semibold">Flow ID</th>
                      <th className="py-2 pr-4 font-semibold">Vendor</th>
                      <th className="py-2 pr-4 font-semibold">Tanggal</th>
                      <th className="py-2 pr-4 font-semibold">Umur</th>
                      <th className="py-2 font-semibold text-right">Estimasi Akrual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.grniList.map((g) => (
                      <tr key={g.id}>
                        <td className="py-2.5 pr-4 font-mono font-semibold text-gray-900 dark:text-white">
                          {g.documentNumber}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-blue-600 dark:text-blue-400">
                          {g.referenceNumber || '-'}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{g.vendor}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{g.documentDate}</td>
                        <td className="py-2.5 pr-4 text-amber-600 font-semibold">{g.ageDays} hari</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white">
                          {formatIdr(g.estimatedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'aging' && (
            data.openPoList.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tidak ada Open PO yang menunggu penerimaan barang.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="py-2 pr-4 font-semibold">No. PO</th>
                      <th className="py-2 pr-4 font-semibold">Vendor</th>
                      <th className="py-2 pr-4 font-semibold">Tanggal</th>
                      <th className="py-2 pr-4 font-semibold">Umur</th>
                      <th className="py-2 font-semibold text-right">Nilai (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.openPoList.map((po) => (
                      <tr key={po.id}>
                        <td className="py-2.5 pr-4 font-mono font-semibold text-gray-900 dark:text-white">
                          {po.documentNumber}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300">{po.vendor}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{po.documentDate}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              po.bucket === '>30d'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : po.bucket === '15-30d'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {po.ageDays} hari ({po.bucket})
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white">
                          {formatIdr(po.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
