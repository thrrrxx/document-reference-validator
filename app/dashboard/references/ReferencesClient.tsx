'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Filter,
  FileText,
  Check,
  X,
  RefreshCw,
  Eye,
  Info,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  FileCheck2,
  Download
} from 'lucide-react';
import { MOCK_REFERENCES, ReferenceItem } from '@/lib/mock-references';

export default function ReferencesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [references, setReferences] = useState<ReferenceItem[]>(MOCK_REFERENCES);
  const [selectedRef, setSelectedRef] = useState<ReferenceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with URL query parameter when clicked from sidebar / cards
  React.useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatus(statusParam);
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
    }, 3000);
  };

  // Counts
  const counts = useMemo(() => {
    const all = references.length;
    const pending = references.filter((r) => r.status === 'pending').length;
    const valid = references.filter((r) => r.status === 'valid').length;
    const failed = references.filter((r) => r.status === 'failed').length;
    return { all, pending, valid, failed };
  }, [references]);

  // Filtered List
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      // Status filter
      if (selectedStatus !== 'all' && ref.status !== selectedStatus) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && ref.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = ref.citation.toLowerCase().includes(query);
        const matchId = ref.id.toLowerCase().includes(query);
        const matchDoc = ref.sourceDoc.toLowerCase().includes(query);
        const matchAuthor = ref.authors?.toLowerCase().includes(query) || false;
        return matchTitle || matchId || matchDoc || matchAuthor;
      }
      return true;
    });
  }, [references, selectedStatus, selectedCategory, searchQuery]);

  // Actions
  const handleApprove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReferences((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'valid', matchedConfidence: 100, issueDetails: undefined } : r
      )
    );
    if (selectedRef?.id === id) {
      setSelectedRef((prev) => prev ? { ...prev, status: 'valid', matchedConfidence: 100, issueDetails: undefined } : null);
    }
    showNotification(`Reference ${id} has been verified and marked as Valid!`);
  };

  const handleReject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReferences((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'failed', issueDetails: 'Marked as rejected by reviewer manual inspection.' } : r
      )
    );
    if (selectedRef?.id === id) {
      setSelectedRef((prev) => prev ? { ...prev, status: 'failed', issueDetails: 'Marked as rejected by reviewer manual inspection.' } : null);
    }
    showNotification(`Reference ${id} has been marked as Failed.`);
  };

  const handleRevalidate = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    showNotification(`Re-crawling DOI and checking registry metadata for ${id}...`);
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
              Document References
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {references.length} Items Total
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review citations extracted from your documents, verify cross-references, and resolve pending issues.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showNotification('Exporting reference dataset as CSV...')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* 2. Status Metric Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* All References */}
        <button
          type="button"
          onClick={() => handleStatusChange('all')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'all'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              All References
            </span>
            <BookOpen className={`w-4 h-4 ${selectedStatus === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{counts.all}</span>
            <span className="text-xs text-gray-500">total cited</span>
          </div>
        </button>

        {/* Pending Review */}
        <button
          type="button"
          onClick={() => handleStatusChange('pending')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'pending'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.pending}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-medium">
              Action needed
            </span>
          </div>
        </button>

        {/* Valid */}
        <button
          type="button"
          onClick={() => handleStatusChange('valid')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'valid'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Valid References
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{counts.valid}</span>
            <span className="text-xs text-gray-500">verified ok</span>
          </div>
        </button>

        {/* Failed */}
        <button
          type="button"
          onClick={() => handleStatusChange('failed')}
          className={`p-4 rounded-2xl border text-left transition duration-200 flex flex-col justify-between ${
            selectedStatus === 'failed'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Failed / Broken
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{counts.failed}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-medium">
              Broken links
            </span>
          </div>
        </button>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search citation title, DOI, author, or document..."
            className="w-full bg-gray-50/80 dark:bg-gray-800/80 focus:bg-white dark:focus:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
          </span>
          {['all', 'journal', 'standard', 'report'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'All Types' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main References Table List */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Reference & Authors</th>
                <th className="px-6 py-3.5">Source Document</th>
                <th className="px-6 py-3.5">Confidence</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredReferences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No references found</p>
                    <p className="text-xs mt-1">Try tweaking your search term or switching the status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReferences.map((ref) => (
                  <tr
                    key={ref.id}
                    onClick={() => setSelectedRef(ref)}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {ref.id}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium capitalize">
                          {ref.category}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 mt-1 line-clamp-2 leading-snug">
                        {ref.citation}
                      </div>
                      {ref.issueDetails && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/70 dark:border-amber-900/60">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{ref.issueDetails}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="truncate max-w-[180px]">{ref.sourceDoc}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        Scanned {ref.validatedAt}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              ref.matchedConfidence >= 90
                                ? 'bg-emerald-500'
                                : ref.matchedConfidence >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${ref.matchedConfidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {ref.matchedConfidence}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {ref.status === 'valid' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Valid</span>
                        </span>
                      )}
                      {ref.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {ref.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {ref.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleApprove(ref.id, e)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 transition"
                              title="Mark as Valid"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleReject(ref.id, e)}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition"
                              title="Mark as Failed"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRef(ref)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                          title="View Details"
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

      {/* 5. Inspection Modal / Drawer when a reference is selected */}
      {selectedRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedRef.id}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  Reference Inspection & Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedRef(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2 border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500 uppercase">Citation Text</span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                {selectedRef.citation}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 font-medium">Source Document:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.sourceDoc}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Matching Confidence:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.matchedConfidence}% verified</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Authors / Committee:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.authors || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Publisher / Journal:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedRef.journalOrPublisher || 'N/A'}</p>
              </div>
            </div>

            {selectedRef.doiOrUrl && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                <span className="text-blue-800 dark:text-blue-300 font-medium truncate max-w-sm">
                  {selectedRef.doiOrUrl}
                </span>
                <a
                  href={selectedRef.doiOrUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                >
                  <span>Open URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {selectedRef.issueDetails && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold block mb-1">Issue Flagged:</span>
                {selectedRef.issueDetails}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={(e) => handleRevalidate(selectedRef.id, e)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check DOI</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleReject(selectedRef.id, e)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  Mark Failed
                </button>
                <button
                  type="button"
                  onClick={(e) => handleApprove(selectedRef.id, e)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                >
                  Approve as Valid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
