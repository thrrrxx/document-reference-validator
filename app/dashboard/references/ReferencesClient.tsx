'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle,
  Trash2,
  Plus,
  Sparkles
} from 'lucide-react';
import { ReferenceItem, DocumentFlowStep, DocumentFlowCode } from '@/lib/mock-references';

export default function ReferencesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawStatus = searchParams.get('status') || 'all';
  const normalizedInitialStatus = rawStatus === 'pending' ? 'missing' : rawStatus === 'valid' ? 'complete' : rawStatus;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(normalizedInitialStatus);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRef, setSelectedRef] = useState<ReferenceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State: Tambah Dokumen Lengkapi (Missing Step)
  const [linkingDocModal, setLinkingDocModal] = useState<{
    flow: ReferenceItem;
    targetStep?: DocumentFlowCode;
  } | null>(null);
  const [inputDocNumber, setInputDocNumber] = useState('');
  const [selectedStepToLink, setSelectedStepToLink] = useState<DocumentFlowCode>('PR');

  // Modal State: Buat Alur Dokumen Baru (+ Create Flow Modal)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newFlowForm, setNewFlowForm] = useState({
    title: '',
    vendor: '',
    totalAmount: '',
    managedBy: '',
    steps: {
      BOM: '',
      PR: '',
      PO: '',
      GRN: '',
      PI: '',
      PP: '',
    },
  });

  // Sync with URL query parameter
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const normalized = statusParam === 'pending' ? 'missing' : statusParam === 'valid' ? 'complete' : statusParam;
      setSelectedStatus(normalized);
    } else {
      setSelectedStatus('all');
    }
  }, [searchParams]);

  // Fetch data dari REST API PostgreSQL
  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/references');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReferences(json.data);
        if (typeof window !== 'undefined' && json.stats) {
          window.dispatchEvent(new CustomEvent('references-updated', { detail: json.stats }));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil alur dokumen dari database:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      router.push('/dashboard/references');
    } else {
      router.push(`/dashboard/references?status=${status}`);
    }
  };

  // Hitung jumlah status
  const counts = useMemo(() => {
    const all = references.length;
    const missing = references.filter((r) => r.status === 'missing').length;
    const complete = references.filter((r) => r.status === 'complete').length;
    return { all, missing, complete };
  }, [references]);

  // Filter list
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      if (selectedStatus !== 'all' && ref.status !== selectedStatus) {
        return false;
      }
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

  // Action: Simpan Alur Dokumen Baru ke PostgreSQL
  const handleCreateFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowForm.title.trim() || !newFlowForm.vendor.trim()) {
      alert('Judul pengadaan dan nama vendor wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAmount = Number(newFlowForm.totalAmount.replace(/[^0-9]/g, '')) || 0;

      const stepsPayload: Record<string, { docNumber: string; notes?: string }> = {};
      Object.entries(newFlowForm.steps).forEach(([code, docNum]) => {
        if (docNum.trim() !== '') {
          stepsPayload[code] = {
            docNumber: docNum.trim(),
            notes: `Nomor ${code} terverifikasi`,
          };
        }
      });

      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newFlowForm.title,
          vendor: newFlowForm.vendor,
          totalAmount: numericAmount,
          managedBy: newFlowForm.managedBy || 'User Dashboard',
          steps: stepsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan ke database');
      }

      showNotification(`Alur dokumen ${json.data.id} berhasil disimpan ke PostgreSQL!`);
      setIsCreateModalOpen(false);
      setNewFlowForm({
        title: '',
        vendor: '',
        totalAmount: '',
        managedBy: '',
        steps: { BOM: '', PR: '', PO: '', GRN: '', PI: '', PP: '' },
      });
      await fetchFlows();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset Generator untuk Belajar / Simulasi Alur Cepat
  const applyPreset = (type: 'complete' | 'missing') => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    if (type === 'complete') {
      setNewFlowForm({
        title: `Pengadaan Server Rack & Fiber Transceiver Seri-${randomNum}`,
        vendor: 'PT. Datacenter Mandiri Indonesia',
        totalAmount: '145000000',
        managedBy: 'Budi Santoso',
        steps: {
          BOM: `BOM-2026-${randomNum}`,
          PR: `PR-2026-${randomNum}`,
          PO: `PO-2026-${randomNum}`,
          GRN: `GRN-2026-${randomNum}`,
          PI: `PI-2026-${randomNum}`,
          PP: `PP-2026-${randomNum}`,
        },
      });
    } else {
      // Missing PR & GRN
      setNewFlowForm({
        title: `Pembelian Switch Core Catalyst & Modul SFP Seri-${randomNum}`,
        vendor: 'PT. Jaringan Dinamika Telematika',
        totalAmount: '88000000',
        managedBy: 'Ahmad Fauzi',
        steps: {
          BOM: `BOM-2026-${randomNum}`,
          PR: '', // Sengaja kosong (Missing)
          PO: `PO-2026-${randomNum}`,
          GRN: '', // Sengaja kosong (Missing)
          PI: `PI-2026-${randomNum}`,
          PP: '',
        },
      });
    }
  };

  // Action: Lengkapi Dokumen Missing ke PostgreSQL
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingDocModal || !inputDocNumber.trim()) {
      alert('Nomor dokumen wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/references', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: linkingDocModal.flow.id,
          code: selectedStepToLink,
          docNumber: inputDocNumber.trim(),
          notes: 'Dokumen susulan berhasil dilengkapi via Dashboard',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal melengkapi dokumen');
      }

      showNotification(`Dokumen ${selectedStepToLink} berhasil ditautkan ke ${linkingDocModal.flow.id}!`);
      setLinkingDocModal(null);
      setInputDocNumber('');
      await fetchFlows();
      if (selectedRef?.id === linkingDocModal.flow.id) {
        setSelectedRef(json.data);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat melengkapi dokumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Hapus Alur Dokumen dari PostgreSQL
  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus alur dokumen ${flowId} beserta seluruh dokumen terkait dari database PostgreSQL?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/references?flowId=${encodeURIComponent(flowId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus');
      }

      showNotification(`Alur ${flowId} berhasil dihapus dari database.`);
      setSelectedRef(null);
      await fetchFlows();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
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

      {/* 1. Header Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Document Reference Validator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {references.length} Alur Dokumen di PostgreSQL
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Validasi urutan dokumen lokal: <span className="font-semibold text-blue-600 dark:text-blue-400">BOM → PR → PO → GRN → PI → PP</span>. Data disimpan langsung ke database PostgreSQL lokal Anda.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchFlows}
            title="Refresh data dari database"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Alur Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Reference Sequence Strip */}
      <div className="bg-white dark:bg-[#0F172A] px-4 py-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">Urutan Standar Dokumen Rantai Pasok:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { code: 'BOM', label: 'Bill of Materials' },
            { code: 'PR', label: 'Purchase Requisition' },
            { code: 'PO', label: 'Purchase Order' },
            { code: 'GRN', label: 'Goods Received Note' },
            { code: 'PI', label: 'Purchase Invoice' },
            { code: 'PP', label: 'Payment Proof' },
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
              <span className="text-xs text-gray-500">Alur Dokumen</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
              Lengkap & Tidak Lengkap
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('missing')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'missing'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-500/80 shadow-xs ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Missing
            </span>
            <FileWarning className={`w-4 h-4 ${selectedStatus === 'missing' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.missing}</span>
              <span className="text-xs text-gray-500">Alur Terputus</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
              Perlu Kelengkapan
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleStatusChange('complete')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'complete'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Complete
            </span>
            <FileCheck className={`w-4 h-4 ${selectedStatus === 'complete' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.complete}</span>
              <span className="text-xs text-gray-500">Alur Terverifikasi</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
              100% Valid
            </span>
          </div>
        </button>
      </div>

      {/* 3. Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari alur pengadaan, ID alur (FLOW-...), vendor, atau nomor dokumen (BOM, PO, GRN, dll)..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200/80 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
        />
      </div>

      {/* 4. Table / Empty State */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden transition-colors duration-200">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat alur dokumen dari database PostgreSQL...</p>
          </div>
        ) : filteredReferences.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {references.length === 0 ? 'Database PostgreSQL Bersih (0 Alur Dokumen)' : 'Tidak Ada Dokumen yang Cocok'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {references.length === 0
                  ? 'Database lokal Anda siap digunakan. Silakan mulai buat alur dokumen baru untuk mempelajari bagaimana sistem memvalidasi alur BOM hingga Invoice.'
                  : 'Coba ubah kata kunci pencarian atau ganti filter status di bagian atas.'}
              </p>
            </div>
            {references.length === 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Alur Dokumen Pertama</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50/75 dark:bg-gray-800/40 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5">ID & Paket Pengadaan</th>
                  <th className="px-6 py-3.5">Vendor Rekanan</th>
                  <th className="px-6 py-3.5">Alur Dokumen (Pipeline)</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-normal">
                {filteredReferences.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{ref.title}</div>
                      <div className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 mt-0.5">{ref.id}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">PIC: {ref.managedBy || 'User'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{ref.vendor}</span>
                      </div>
                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{ref.totalAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {ref.flowSteps.map((step, idx) => (
                          <React.Fragment key={step.code}>
                            {idx > 0 && <span className="text-gray-400 text-xs font-bold">→</span>}
                            <button
                              type="button"
                              onClick={() => {
                                if (step.status === 'missing') {
                                  setSelectedStepToLink(step.code);
                                  setLinkingDocModal({ flow: ref, targetStep: step.code });
                                } else {
                                  setSelectedRef(ref);
                                }
                              }}
                              title={
                                step.status === 'present'
                                  ? `${step.label}: ${step.docNumber} (${step.date})`
                                  : `${step.label}: Belum terlampir (Klik untuk melengkapi)`
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                                step.status === 'present'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-dashed border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                              }`}
                            >
                              {step.code}
                              {step.status === 'missing' ? ' ✕' : ' ✓'}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                      {ref.issueDetails && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-sm">{ref.issueDetails}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {ref.status === 'complete' ? (
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
                      <div className="flex items-center justify-end gap-2">
                        {ref.status === 'missing' && (
                          <button
                            type="button"
                            onClick={() => {
                              const firstMissing = ref.flowSteps.find((s) => s.status === 'missing');
                              if (firstMissing) setSelectedStepToLink(firstMissing.code);
                              setLinkingDocModal({ flow: ref, targetStep: firstMissing?.code });
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold hover:bg-blue-100 transition"
                          >
                            + Lengkapi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRef(ref)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                          Rincian
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFlow(ref.id)}
                          title="Hapus alur ini"
                          className="text-xs p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT ALUR DOKUMEN BARU (CREATE NEW FLOW)                          */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <span>Buat Alur Dokumen Pengadaan Baru</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Data akan disimpan ke tabel PostgreSQL lokal (`document` & `documentReference`).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Helper Bar for Learning */}
            <div className="bg-blue-50/70 dark:bg-blue-950/30 px-6 py-2.5 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3 text-xs">
              <span className="text-blue-800 dark:text-blue-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulasi Cepat untuk Belajar Alur:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('complete')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  Contoh Lengkap (Complete)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('missing')}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
                >
                  Contoh Terputus (Missing)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateFlowSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              {/* Field 1: Paket Pengadaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Judul Paket Pengadaan / Proyek *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFlowForm.title}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, title: e.target.value })}
                    placeholder="Contoh: Pengadaan Server Switch Data Center"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Vendor Rekanan *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFlowForm.vendor}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, vendor: e.target.value })}
                    placeholder="Contoh: PT. Datacenter Mandiri Indonesia"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Field 2: Total Amount & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estimasi / Nilai Kontrak (Rp)
                  </label>
                  <input
                    type="number"
                    value={newFlowForm.totalAmount}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, totalAmount: e.target.value })}
                    placeholder="120000000"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    PIC / Pengelola
                  </label>
                  <input
                    type="text"
                    value={newFlowForm.managedBy}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, managedBy: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              {/* Field 3: 6-Step Pipeline Checklist Input */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Nomor Dokumen Rantai Pasok (Kosongkan jika belum terbit):
                  </h4>
                  <span className="text-[11px] text-gray-400">Jika ada dokumen kosong, alur berstatus Missing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { code: 'BOM' as const, label: '1. Bill of Materials (BOM)', placeholder: 'BOM-2026-0042' },
                    { code: 'PR' as const, label: '2. Purchase Requisition (PR)', placeholder: 'PR-2026-0104' },
                    { code: 'PO' as const, label: '3. Purchase Order (PO)', placeholder: 'PO-2026-0312' },
                    { code: 'GRN' as const, label: '4. Goods Received Note (GRN)', placeholder: 'GRN-2026-0520' },
                    { code: 'PI' as const, label: '5. Purchase Invoice (PI)', placeholder: 'PI-2026-1189' },
                    { code: 'PP' as const, label: '6. Payment Proof (PP)', placeholder: 'PP-2026-0811' },
                  ].map((step) => (
                    <div key={step.code} className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                        {step.label}
                      </label>
                      <input
                        type="text"
                        value={newFlowForm.steps[step.code]}
                        onChange={(e) =>
                          setNewFlowForm({
                            ...newFlowForm,
                            steps: { ...newFlowForm.steps, [step.code]: e.target.value },
                          })
                        }
                        placeholder={step.placeholder}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LENGKAPI DOKUMEN MISSING (LINK MISSING DOCUMENT)                  */}
      {/* ========================================================================= */}
      {linkingDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Lengkapi Dokumen Alur</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Alur: <span className="font-mono font-semibold text-blue-600">{linkingDocModal.flow.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkingDocModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pilih Tahap Dokumen yang Ingin Dilengkapi
                </label>
                <select
                  value={selectedStepToLink}
                  onChange={(e) => setSelectedStepToLink(e.target.value as DocumentFlowCode)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="BOM">BOM - Bill of Materials</option>
                  <option value="PR">PR - Purchase Requisition</option>
                  <option value="PO">PO - Purchase Order</option>
                  <option value="GRN">GRN - Goods Received Note</option>
                  <option value="PI">PI - Purchase Invoice</option>
                  <option value="PP">PP - Payment Proof</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nomor Dokumen *
                </label>
                <input
                  type="text"
                  required
                  value={inputDocNumber}
                  onChange={(e) => setInputDocNumber(e.target.value)}
                  placeholder={`Contoh: ${selectedStepToLink}-2026-0520`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLinkingDocModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tautkan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RINCIAN DETAIL ALUR (DETAIL MODAL)                                */}
      {/* ========================================================================= */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {selectedRef.id}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{selectedRef.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vendor: {selectedRef.vendor}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRef(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pipeline Step Visual List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Urutan Dokumen (6-Step Pipeline):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRef.flowSteps.map((step) => (
                  <div
                    key={step.code}
                    className={`p-3.5 rounded-xl border flex items-start justify-between ${
                      step.status === 'present'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-dashed border-rose-300 dark:border-rose-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-white">
                          [{step.code}]
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {step.label}
                        </span>
                      </div>
                      {step.docNumber ? (
                        <div className="mt-1 text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                          {step.docNumber}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                          Dokumen belum terbit / hilang
                        </div>
                      )}
                      {step.date && <div className="text-[11px] text-gray-400 mt-0.5">{step.date}</div>}
                    </div>
                    {step.status === 'present' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStepToLink(step.code);
                          setLinkingDocModal({ flow: selectedRef, targetStep: step.code });
                        }}
                        className="text-[11px] px-2 py-0.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                      >
                        + Isi
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteFlow(selectedRef.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Alur Dokumen</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRef(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
