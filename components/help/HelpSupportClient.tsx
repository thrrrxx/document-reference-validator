'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Send,
  FileText,
  Activity,
  Code,
  ShieldCheck,
  LifeBuoy,
  Clock,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import {
  MOCK_FAQS,
  MOCK_QUICK_GUIDES,
  MOCK_SYSTEM_STATUSES,
  FaqItem,
  QuickGuideItem
} from '@/lib/mock-help';

export default function HelpSupportClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [activeGuide, setActiveGuide] = useState<QuickGuideItem | null>(null);

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Citation Resolution Issue');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [ticketRefId, setTicketRefId] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    return MOCK_FAQS.filter((faq) => {
      if (selectedCategory !== 'all' && faq.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchQuestion = faq.question.toLowerCase().includes(q);
        const matchAnswer = faq.answer.toLowerCase().includes(q);
        const matchTag = faq.tags.some((t) => t.toLowerCase().includes(q));
        return matchQuestion || matchAnswer || matchTag;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      const newTicketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedTicketId(newTicketId);
      setIsSubmittingTicket(false);
      setTicketSubject('');
      setTicketRefId('');
      setTicketMessage('');
      showToast(`Support ticket ${newTicketId} created! An engineering specialist will respond shortly.`);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl border border-gray-700 dark:border-gray-200 animate-in fade-in slide-in-from-bottom-4 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Hero Knowledge Base Search Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 sm:p-10 rounded-3xl shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-3 border border-white/20">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Validex Support & Documentation Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How can we assist your research validation?
          </h1>
          <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-xl">
            Search our knowledge base, troubleshoot citation algorithms, or submit a direct engineering inquiry.
          </p>

          {/* Search Input Bar */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics: '404 DOI', 'Zotero sync', 'Confidence score', 'API key'..."
              className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-sm pl-12 pr-24 py-3.5 rounded-2xl shadow-lg border-0 focus:outline-hidden focus:ring-4 focus:ring-white/30 transition font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Pill Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="text-blue-200 font-medium">Common searches:</span>
            {['Confidence Score', 'Broken DOI', 'Zotero Sync', 'REST API', 'Retracted Papers'].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setSearchQuery(pill)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition backdrop-blur-xs"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Live System Registry Status Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                All Registry Gateways Operational
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                100% Uptime
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live queries to Crossref, PubMed, IEEE Xplore, and Semantic Scholar are resolving at optimal latencies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {MOCK_SYSTEM_STATUSES.map((sys) => (
            <div
              key={sys.service}
              className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 whitespace-nowrap flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{sys.service.split(' ')[0]}</span>
              <span className="text-[11px] text-gray-400">({sys.latency})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Start & Practical Guides */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Quick Start Guides & Walkthroughs
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Step-by-step instructions to get the most out of your Validex workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MOCK_QUICK_GUIDES.map((guide) => (
            <div
              key={guide.id}
              className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                    {guide.badge}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {guide.readTime}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                  {guide.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {guide.description}
                </p>

                {/* Steps */}
                <div className="mt-4 space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => showToast(`Opening guide "${guide.title}"...`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Clear answers to common questions about citations, parsing, and registries.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All FAQs' },
              { id: 'citations', label: 'Citations & DOI' },
              { id: 'documents', label: 'Documents & OCR' },
              { id: 'integrations', label: 'API & Integrations' },
              { id: 'account', label: 'Account & Security' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <HelpCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="font-semibold text-sm">No matching FAQ articles found</p>
              <p className="text-xs mt-1">Try another search keyword or submit a ticket below.</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group"
                  >
                    <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition flex-shrink-0">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300 pr-8 animate-in fade-in duration-200">
                      <p>{faq.answer}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. Support Ticket Submission Card */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Submit an Engineering Support Inquiry
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Encountering an unresolvable DOI, OCR anomaly, or webhook issue? Our citation engineers are here to assist.
            </p>
          </div>
          {submittedTicketId && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Ticket {submittedTicketId} Logged
            </span>
          )}
        </div>

        <form onSubmit={handleTicketSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Subject */}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Inquiry Subject / Summary
              </label>
              <input
                type="text"
                placeholder="e.g. Broken DOI matching on IEEE Conference CVPR 2026 paper"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Issue Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="Citation Resolution Issue">Citation Resolution Issue</option>
                <option value="Document OCR / Parsing Failure">Document OCR / Parsing Failure</option>
                <option value="API & Webhook Integration">API & Webhook Integration</option>
                <option value="Billing & Team Workspace">Billing & Team Workspace</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Urgency / Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTicketPriority(p)}
                    className={`p-2 rounded-xl border text-xs font-bold capitalize transition ${
                      ticketPriority === p
                        ? p === 'urgent'
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          : 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Related Reference or Document ID */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Related Document or Ref ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. DOC-1001 or REF-8918"
                value={ticketRefId}
                onChange={(e) => setTicketRefId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe the unexpected verification behavior, expected outcome, or error message..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              required
              className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-gray-400">
              Avg response time: &lt;2 hours during business hours (08:00 - 20:00 UTC).
            </p>
            <button
              type="submit"
              disabled={isSubmittingTicket}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingTicket ? (
                <span>Logging Ticket...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 6. Direct Contact & Community Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Developer REST API Docs</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Explore API specifications, webhooks, and SDKs.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-2"
            >
              <span>Account Settings</span> &rarr;
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Enterprise SLA & Security</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              SOC 2 Type II certified data handling and GDPR terms.
            </p>
            <Link
              href="/dashboard/settings/security"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-2"
            >
              <span>Security Center</span> &rarr;
            </Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Live System Status</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Subscribe to incident alerts and gateway maintenance.
            </p>
            <button
              type="button"
              onClick={() => showToast('Status page subscription confirmed.')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline mt-2"
            >
              <span>Status Portal</span> &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
