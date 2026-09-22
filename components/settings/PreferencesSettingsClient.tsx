'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  Bell,
  Sliders,
  Database,
  ShieldAlert,
  Layout,
  Save,
  Info
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { INITIAL_PREFERENCES, ValidationPreferences } from '@/lib/mock-settings';

export default function PreferencesSettingsClient() {
  const [preferences, setPreferences] = useState<ValidationPreferences>(INITIAL_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      showToast('Validation and workspace preferences saved!');
    }, 800);
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
      <SettingsHeader
        title="Validation & Workspace Preferences"
        description="Fine-tune verification thresholds, automated registry queries, and alerting schedules."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 2. Validation Engine Rules */}
        <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Automated Validation Engine Rules
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Control algorithm sensitivity and criteria for automatic verification.
            </p>
          </div>

          {/* Threshold Slider */}
          <div className="p-4 rounded-xl bg-gray-50/75 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-gray-900 dark:text-white block">
                  Automatic Verification Confidence Threshold
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Citations with algorithm confidence at or above this score are automatically marked as Valid.
                </p>
              </div>
              <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                {preferences.autoVerifyThreshold}%
              </span>
            </div>

            <input
              type="range"
              min={50}
              max={99}
              value={preferences.autoVerifyThreshold}
              onChange={(e) =>
                setPreferences({ ...preferences, autoVerifyThreshold: Number(e.target.value) })
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
              <span>50% (Lenient)</span>
              <span>85% (Recommended)</span>
              <span>99% (Ultra Strict)</span>
            </div>
          </div>

          {/* Registry Query Toggles */}
          <div>
            <label className="text-xs font-bold text-gray-900 dark:text-white block mb-3">
              Authoritative Registry Querying
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'enableCrossrefLookup',
                  label: 'Crossref DOI Resolution',
                  desc: 'Queries 140M+ academic DOIs and publisher metadata.',
                  checked: preferences.enableCrossrefLookup,
                },
                {
                  id: 'enablePubMedLookup',
                  label: 'PubMed / NCBI Engine',
                  desc: 'Matches biomedical citations and PMID numbers.',
                  checked: preferences.enablePubMedLookup,
                },
                {
                  id: 'enableIeeeLookup',
                  label: 'IEEE Xplore Catalog',
                  desc: 'Verifies technical proceedings and electrical standards.',
                  checked: preferences.enableIeeeLookup,
                },
                {
                  id: 'enableSemanticScholarLookup',
                  label: 'Semantic Scholar AI Graph',
                  desc: 'Recovers missing author and year metadata.',
                  checked: preferences.enableSemanticScholarLookup,
                },
              ].map((reg) => (
                <label
                  key={reg.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition"
                >
                  <input
                    type="checkbox"
                    checked={reg.checked}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        [reg.id]: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      {reg.label}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                      {reg.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compliance Safeguards */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-900 dark:text-white block">
              Integrity Safeguards & Quality Checks
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Flag Withdrawn / Retracted Publications
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    Trigger high-priority warnings if a cited paper was retracted by publisher.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.flagRetractedPapers}
                  onChange={(e) =>
                    setPreferences({ ...preferences, flagRetractedPapers: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Automatic Duplicate Citation Detection
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    Highlight identical citations referenced under multiple keys in the same document.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.detectDuplicates}
                  onChange={(e) =>
                    setPreferences({ ...preferences, detectDuplicates: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 3. Alerts & Notifications */}
        <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Notifications & Email Digests
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choose when and how Validex alerts you regarding validation issues.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                  Weekly Citation Compliance Digest
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Receive a Monday summary of verified vs broken citations across all documents.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailWeeklyDigest}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailWeeklyDigest: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                  Immediate Alerts on Broken References (404/410)
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Send immediate email whenever a document has &gt;3 unresolvable references.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailBrokenLinkAlerts}
                onChange={(e) =>
                  setPreferences({ ...preferences, emailBrokenLinkAlerts: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* 4. Display Preferences */}
        <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-600" />
              Workspace & Interface Preferences
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Customize table layout and date representation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Table Row Density
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['comfortable', 'compact'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        tableDensity: d as 'comfortable' | 'compact',
                      })
                    }
                    className={`p-3 rounded-xl border text-xs font-semibold capitalize transition ${
                      preferences.tableDensity === d
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {d} Density
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Date & Time Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    dateFormat: e.target.value as ValidationPreferences['dateFormat'],
                  })
                }
                className="w-full bg-gray-50 dark:bg-gray-800 text-xs px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              >
                <option value="YYYY-MM-DD">ISO 8601 (2026-09-22)</option>
                <option value="DD/MM/YYYY">European (22/09/2026)</option>
                <option value="MM/DD/YYYY">US Standard (09/22/2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span>Saving Preferences...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
