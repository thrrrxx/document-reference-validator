'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  FileUp,
  Search,
  Trash2,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  MoreVertical,
  ExternalLink,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpDown,
  Download,
  Eye,
  X
} from 'lucide-react';
import { MOCK_DOCUMENTS, DocumentItem } from '@/lib/mock-documents';

export default function DocumentsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state sync: ?view=trash or ?sort=recent
  const viewParam = searchParams.get('view');
  const sortParam = searchParams.get('sort');

  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when URL search params change
  useEffect(() => {
    if (viewParam === 'trash') {
      setActiveTab('trash');
    } else if (sortParam === 'recent') {
      setActiveTab('recent');
    } else {
      setActiveTab('all');
    }
  }, [viewParam, sortParam]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Counts
  const counts = useMemo(() => {
    const activeDocs = documents.filter((d) => !d.isTrash);
    const trashDocs = documents.filter((d) => d.isTrash);
    const recentDocs = activeDocs.filter(
      (d) => Date.now() - d.uploadedTimestamp < 72 * 3600 * 1000
    );
    return {
      all: activeDocs.length,
      recent: recentDocs.length,
      trash: trashDocs.length,
    };
  }, [documents]);

  // Tab switcher helper
  const handleTabChange = (tab: 'all' | 'recent' | 'trash') => {
    setActiveTab(tab);
    if (tab === 'trash') {
      router.push('/dashboard/documents?view=trash');
    } else if (tab === 'recent') {
      router.push('/dashboard/documents?sort=recent');
    } else {
      router.push('/dashboard/documents');
    }
  };

  // Filtered and Sorted Docs
  const displayedDocuments = useMemo(() => {
    let result = documents.filter((doc) => {
      // Trash view filter
      if (activeTab === 'trash') {
        if (!doc.isTrash) return false;
      } else {
        if (doc.isTrash) return false;
      }

      // Recent view filter (last 72 hours)
      if (activeTab === 'recent') {
        const isRecent = Date.now() - doc.uploadedTimestamp < 72 * 3600 * 1000;
        if (!isRecent) return false;
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return doc.name.toLowerCase().includes(q) || doc.id.toLowerCase().includes(q);
      }

      return true;
    });

    if (activeTab === 'recent') {
      result.sort((a, b) => b.uploadedTimestamp - a.uploadedTimestamp);
    }

    return result;
  }, [documents, activeTab, searchQuery]);

  // Document actions
  const moveToTrash = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isTrash: true } : d))
    );
    showToast(`Document moved to Trash.`);
  };

  const restoreFromTrash = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isTrash: false } : d))
    );
    showToast(`Document restored.`);
  };

  const permanentlyDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast(`Document permanently deleted.`);
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: DocumentItem = {
      id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Submitted_Manuscript_2026.pdf',
      size: '3.1 MB',
      fileType: 'pdf',
      uploadedAt: 'Just now',
      uploadedTimestamp: Date.now(),
      totalReferences: 24,
      validCount: 22,
      pendingCount: 2,
      failedCount: 0,
      status: 'needs_attention',
      isTrash: false,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setIsUploadModalOpen(false);
    showToast(`File uploaded! 24 citations extracted and scheduled for validation.`);
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

      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Documents Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {counts.all} Active Files
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload manuscripts, standards, or PDFs to automatically extract and validate citations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (All Documents / Recent / Trash) */}
      <div className="grid grid-cols-3 gap-3.5 max-w-xl">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 flex items-center justify-between ${
            activeTab === 'all'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className={`w-4 h-4 ${activeTab === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">All Documents</span>
          </div>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{counts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('recent')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 flex items-center justify-between ${
            activeTab === 'recent'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 ${activeTab === 'recent' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Recent</span>
          </div>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{counts.recent}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('trash')}
          className={`p-3.5 rounded-2xl border text-left transition duration-200 flex items-center justify-between ${
            activeTab === 'trash'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500/80 shadow-xs'
              : 'bg-white dark:bg-[#0F172A] border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className={`w-4 h-4 ${activeTab === 'trash' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'}`} />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Trash</span>
          </div>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{counts.trash}</span>
        </button>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document name or file ID..."
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

        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing {displayedDocuments.length} document{displayedDocuments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* 4. Documents Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Document Details</th>
                <th className="px-6 py-3.5">File Size</th>
                <th className="px-6 py-3.5">Uploaded</th>
                <th className="px-6 py-3.5">Citations Breakdown</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <FolderOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      {activeTab === 'trash' ? 'Trash is empty' : 'No documents found'}
                    </p>
                    <p className="text-xs mt-1">
                      {activeTab === 'trash'
                        ? 'Items moved to trash will appear here.'
                        : 'Upload a document or change your search filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase ${
                          doc.fileType === 'pdf'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            : doc.fileType === 'docx'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          {doc.fileType}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {doc.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{doc.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {doc.size}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {doc.uploadedAt}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {doc.totalReferences}
                        </span>
                        <span className="text-gray-400">refs:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium">
                          {doc.validCount} valid
                        </span>
                        {doc.pendingCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-medium">
                            {doc.pendingCount} pending
                          </span>
                        )}
                        {doc.failedCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-medium">
                            {doc.failedCount} failed
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.status === 'validated' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Validated</span>
                        </span>
                      )}
                      {doc.status === 'needs_attention' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Needs Review</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {activeTab === 'trash' ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => restoreFromTrash(doc.id, e)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                              title="Restore Document"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => permanentlyDelete(doc.id, e)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/dashboard/references?doc=${encodeURIComponent(doc.name)}`}
                              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                              title="Inspect References"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => moveToTrash(doc.id, e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedDoc.id}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {selectedDoc.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
              <div>
                <span className="text-gray-500">File Type:</span>
                <p className="font-semibold text-gray-900 dark:text-white uppercase">{selectedDoc.fileType}</p>
              </div>
              <div>
                <span className="text-gray-500">File Size:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedDoc.size}</p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded Time:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedDoc.uploadedAt}</p>
              </div>
              <div>
                <span className="text-gray-500">Extracted Citations:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedDoc.totalReferences} items</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Citation Validation Status</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                  {selectedDoc.validCount} Valid
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
                  {selectedDoc.pendingCount} Pending Review
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold">
                  {selectedDoc.failedCount} Broken/Failed
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
              <Link
                href="/dashboard/references"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Inspect References in this Document
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 6. Upload Modal Dialog */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Upload New Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center transition cursor-pointer bg-gray-50/50 dark:bg-gray-800/30">
                <FileUp className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT up to 25MB</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                >
                  Confirm & Extract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
