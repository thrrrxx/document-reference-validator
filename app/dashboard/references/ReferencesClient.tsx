'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Check,
  X,
  RefreshCw,
  Eye,
  ChevronRight,
  Download,
  Layers,
  FileWarning,
  FileCheck,
  ArrowRight,
  Building2,
  Paperclip,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { MOCK_REFERENCES, ReferenceItem, DocumentFlowStep } from '@/lib/mock-references';

export default function ReferencesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Normalize initial status: pending -> missing, valid -> complete
  const rawStatus = searchParams.get('status') || 'all';
  const normalizedInitialStatus = rawStatus === 'pending' ? 'missing' : rawStatus === 'valid' ? 'complete' : rawStatus;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(normalizedInitialStatus);
  const [references, setReferences] = useState<ReferenceItem[]>(MOCK_REFERENCES);
  const [selectedRef, setSelectedRef] = useState<ReferenceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [linkingDocModal, setLinkingDocModal] = useState<ReferenceItem | null>(null);
  const [inputDocNumber, setInputDocNumber] = useState('');

  // Sync with URL query parameter
  React.useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const normalized = statusParam === 'pending' ? 'missing' : statusParam === 'valid' ? 'complete' : statusParam;
      setSelectedStatus(normalized);
    } else {
      setSelectedStatus('all');
    }
  }, [searchParams]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      router.push('/dashboard/references');
    } else {
      router.push(`/dashboard/references?status=${status}`);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Counts
  const counts = useMemo(() => {
    const all = references.length;
    const missing = references.filter((r) => r.status === 'missing').length;
    const complete = references.filter((r) => r.status === 'complete').length;
    return { all, missing, complete };
  }, [references]);

  // Filtered List
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      // Status filter
      if (selectedStatus !== 'all' && ref.status !== selectedStatus) {
        return false;
      }
      // Search query across title, id, vendor, and flow doc numbers
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = ref.title.toLowerCase().includes(query);
        const matchId = ref.id.toLowerCase().includes(query);
        const matchVendor = ref.vendor.toLowerCase().includes(query);
        const matchDoc = ref.flowSteps.some(
          (step) => step.docNumber && step.docNumber.toLowerCase().includes(query)
        );
        return matchTitle || matchId || matchVendor || matchDoc;
      }
      return true;
    });
  }, [references, selectedStatus, searchQuery]);

  // Action: Attach / resolve missing step
  const handleResolveMissing = (flowId: string, customDocNo?: string) => {
    setReferences((prev) =>
      prev.map((item) => {
        if (item.id === flowId) {
          const updatedSteps: DocumentFlowStep[] = item.flowSteps.map((s) => {
            if (s.status === 'missing') {
              return {
                ...s,
                status: 'present' as const,
                docNumber: customDocNo || `${s.code}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                date: 'Hari ini',
                notes: 'Dokumen susulan berhasil diverifikasi & ditautkan',
              };
            }
            return s;
          });
          return {
            ...item,
            status: 'complete' as const,
            missingDoc: undefined,
            issueDetails: undefined,
            flowSteps: updatedSteps,
          };
        }
        return item;
      })
    );

    if (selectedRef?.id === flowId) {
      setSelectedRef((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'complete' as const,
          missingDoc: undefined,
          issueDetails: undefined,
          flowSteps: prev.flowSteps.map((s) =>
            s.status === 'missing'
              ? {
                  ...s,
                  status: 'present' as const,
                  docNumber: customDocNo || `${s.code}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                  date: 'Hari ini',
                  notes: 'Dokumen susulan berhasil diverifikasi & ditautkan',
                }
              : s
          ),
        };
      });
    }

    setLinkingDocModal(null);
    setInputDocNumber('');
    showNotification(`Alur dokumen ${flowId} berhasil dilengkapi dan ditandai Complete!`);
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

      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Document Reference Validator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {references.length} Alur Dokumen
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Validasi urutan alur dokumen: <span className="font-semibold text-blue-600 dark:text-blue-400">BOM → PR → PO → GRN → PI → PP</span>. Jika urutan dokumen tidak lengkap/tidak sesuai maka berada di <span className="font-semibold text-amber-600 dark:text-amber-400">Missing</span>, dan jika lengkap sesuai urutan maka berada di <span className="font-semibold text-emerald-600 dark:text-emerald-400">Complete</span>.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showNotification('Mengekspor rekap alur dokumen ke CSV...')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={() => showNotification('Memvalidasi ulang seluruh referensi silang alur dokumen ERP...')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Revalidasi Alur</span>
          </button>
        </div>
      </div>

      {/* Quick Reference Sequence Strip */}
      <div className="bg-white dark:bg-[#0F172A] px-4 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">Urutan Standar Dokumen:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { code: 'BOM', label: 'Bill of Materials' },
            { code: 'PR', label: 'Purchase Requisition' },
            { code: 'PO', label: 'Purchase Order' },
            { code: 'GRN', label: 'Goods Received Note' },
            { code: 'PI', label: 'Purchase Invoice' },
            { code: 'PP', label: 'Payment Payment' },
          ].map((item, idx) => (
            <React.Fragment key={item.code}>
              {idx > 0 && <span className="text-gray-400 font-bold">→</span>}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{item.code}</span>
                <span className="text-gray-400">=</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2. Status Metric Tabs: All Document, Missing, Complete */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Tab 1: All Document */}
        <button
          type="button"
          onClick={() => handleStatusChange('all')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'all'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              All Document
            </span>
            <Layers className={`w-4 h-4 ${selectedStatus === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{counts.all}</span>
              <span className="text-xs text-gray-500">alur dokumen</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              Lengkap & Tidak Lengkap
            </span>
          </div>
        </button>

        {/* Tab 2: Missing */}
        <button
          type="button"
          onClick={() => handleStatusChange('missing')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'missing'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/80 shadow-xs ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Missing
            </span>
            <FileWarning className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.missing}</span>
              <span className="text-xs text-amber-700 dark:text-amber-300">alur kurang</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold">
              Perlu Dokumen
            </span>
          </div>
        </button>

        {/* Tab 3: Complete */}
        <button
          type="button"
          onClick={() => handleStatusChange('complete')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'complete'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Complete
            </span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.complete}</span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300">alur lengkap</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-semibold">
              100% Valid
            </span>
          </div>
        </button>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-[480px]">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID alur, nomor BOM / PR / PO / GRN / PI / PP, atau vendor..."
            className="w-full bg-gray-50/80 dark:bg-gray-800/80 focus:bg-white dark:focus:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 pl-10 pr-16 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-medium"
            >
              Hapus
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium self-end sm:self-center">
          Menampilkan <span className="font-bold text-gray-800 dark:text-gray-200">{filteredReferences.length}</span> dari {references.length} alur dokumen
        </div>
      </div>

      {/* 4. Main Document Flow Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Paket Pengadaan & Vendor</th>
                <th className="px-6 py-3.5">Visualisasi Alur Dokumen</th>
                <th className="px-6 py-3.5">Status Alur</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredReferences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <Layers className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Tidak ada alur dokumen ditemukan</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian atau ubah tab status di atas.</p>
                  </td>
                </tr>
              ) : (
                filteredReferences.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRef(item)}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition"
                  >
                    {/* Column 1: Info & Vendor */}
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.id}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mt-1 leading-snug">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{item.vendor}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.totalAmount}</span>
                      </div>
                      {item.issueDetails && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/70 dark:border-amber-900/60">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <span className="leading-snug">{item.issueDetails}</span>
                        </div>
                      )}
                    </td>

                    {/* Column 2: Alur Dokumen Stepper */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {item.flowSteps.map((step, idx) => (
                          <React.Fragment key={step.code}>
                            {idx > 0 && (
                              <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition ${
                                step.status === 'present'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-dashed border-rose-300 dark:border-rose-800 animate-pulse'
                              }`}
                              title={
                                step.status === 'present'
                                  ? `${step.label}: ${step.docNumber} (${step.notes || ''})`
                                  : `${step.label} KURANG: ${step.notes || 'Dokumen belum ada'}`
                              }
                            >
                              {step.status === 'present' ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              )}
                              <span className="font-bold">{step.code}</span>
                              {step.status === 'missing' && (
                                <span className="text-[10px] font-sans text-rose-600 dark:text-rose-400 font-semibold">
                                  Missing
                                </span>
                              )}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2">
                        Pembaruan: {item.validatedAt}
                      </div>
                    </td>

                    {/* Column 3: Status Alur */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status === 'complete' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Complete</span>
                        </span>
                      ) : (
                        <div className="inline-flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Missing</span>
                          </span>
                          {item.missingDoc && (
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                              Kurang: {item.missingDoc}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Column 4: Aksi */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {item.status === 'missing' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkingDocModal(item);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition"
                            title="Lengkapi Alur Dokumen"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Lengkapi</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRef(item)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          title="Inspeksi Alur Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail Inspection Modal */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedRef.id}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold ${
                    selectedRef.status === 'complete'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {selectedRef.status === 'complete' ? 'Alur Lengkap' : 'Alur Dokumen Kurang'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {selectedRef.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRef(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incomplete Warning Banner */}
            {selectedRef.status === 'missing' && selectedRef.issueDetails && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span>Alur Dokumen Belum Lengkap: {selectedRef.missingDoc}</span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  {selectedRef.issueDetails}
                </p>
              </div>
            )}

            {/* Stepper Pipeline Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rangkaian Alur Dokumen (Flow Steps)
                </h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-semibold">
                  BOM → PR → PO → GRN → PI → PP
                </span>
              </div>
              <div className="space-y-3">
                {selectedRef.flowSteps.map((step) => (
                  <div
                    key={step.code}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                      step.status === 'present'
                        ? 'bg-gray-50/80 dark:bg-gray-800/40 border-gray-200/80 dark:border-gray-800'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-dashed border-rose-300 dark:border-rose-900'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        step.status === 'present'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {step.step}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {step.label}
                          </span>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            ({step.code})
                          </span>
                        </div>
                        {step.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            <Check className="w-3.5 h-3.5" /> Ada & Tervalidasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                            <X className="w-3.5 h-3.5" /> Hilang / Kurang
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {step.status === 'present' ? (
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                              {step.docNumber}
                            </span>
                            {step.date && <span className="text-gray-400">• Tanggal: {step.date}</span>}
                          </div>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            Dokumen ini tidak ditemukan pada alur pengadaan. Seharusnya ada sebelum langkah berikutnya.
                          </span>
                        )}
                      </div>
                      {step.notes && (
                        <p className="mt-1 text-[11px] text-gray-500 italic">
                          Catatan: {step.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata Information */}
            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-gray-500 font-medium">Vendor Rekanan:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.vendor}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Total Nilai Alur:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.totalAmount}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">PIC Pengadaan:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.managedBy || 'Tim Procurement'}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Status Validasi:</span>
                <p className={`font-semibold mt-0.5 ${selectedRef.status === 'complete' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {selectedRef.status === 'complete' ? 'Complete (Lengkap)' : 'Missing (Kurang)'}
                </p>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => showNotification(`Mengunduh berkas bundel dokumen ${selectedRef.id}...`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Bundel Dokumen</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedRef.status === 'missing' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLinkingDocModal(selectedRef);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Lengkapi Dokumen Alur</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedRef(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal for Linking / Attaching Missing Document */}
      {linkingDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Lengkapi Dokumen Alur
              </h3>
              <button
                onClick={() => setLinkingDocModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Alur <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{linkingDocModal.id}</span> terdeteksi kekurangan dokumen <span className="font-semibold text-rose-600 dark:text-rose-400">{linkingDocModal.missingDoc}</span>. Masukkan nomor dokumen resmi untuk melengkapi alur:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Nomor Dokumen Pengganti / Susulan:
              </label>
              <input
                type="text"
                value={inputDocNumber}
                onChange={(e) => setInputDocNumber(e.target.value)}
                placeholder={`Contoh: ${linkingDocModal.flowSteps.find(s => s.status === 'missing')?.code || 'DOC'}-2026-0941`}
                className="w-full bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-800 dark:text-blue-300">
              Setelah ditautkan, alur ini akan otomatis berpindah status dari <span className="font-bold">Missing</span> menjadi <span className="font-bold">Complete</span>.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkingDocModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleResolveMissing(linkingDocModal.id, inputDocNumber || undefined)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                Simpan & Tandai Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
