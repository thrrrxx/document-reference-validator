'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code,
  Shield,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { INITIAL_API_KEYS, ApiKeyItem } from '@/lib/mock-settings';

export default function ApiKeysSettingsClient() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<ApiKeyItem['scope']>('Full Validator Access');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSecret = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 10);
    const fullToken = `val_live_${randomSecret}`;
    const masked = `val_live_••••••••••••${randomSecret.slice(-4)}`;

    const newKey: ApiKeyItem = {
      id: `KEY-${Math.floor(100 + Math.random() * 900)}`,
      name: newKeyName.trim(),
      keyPrefix: 'val_live_',
      keyMasked: masked,
      scope: newKeyScope,
      createdAt: 'Just now',
      lastUsedAt: 'Never',
      status: 'active',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    setGeneratedRawKey(fullToken);
    showToast(`Key "${newKey.name}" created!`);
  };

  const handleRevokeKey = (id: string, name: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    showToast(`API Key "${name}" has been revoked.`);
  };

  const copyToClipboard = (text: string, label = 'Key') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewKeyName('');
    setGeneratedRawKey(null);
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
        title="Developer API Keys & Integrations"
        description="Authenticate programmatic requests for automated citation validation in CI/CD and publishing pipelines."
      />

      {/* 2. Top Info Banner */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Validex REST API v1
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Endpoint Base URL: <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">https://api.validex.io/v1</code>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* 3. API Keys Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Active API Keys
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Secret keys granting access to your Validex workspace validation engine.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {apiKeys.length} of 10 slots used
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Key Name & Token</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Created Date</th>
                <th className="px-6 py-3.5">Last Used</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No active API keys. Click &quot;Generate New API Key&quot; to create one.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>{k.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="font-mono text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {k.keyMasked}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(k.keyMasked, 'Masked key string')}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          title="Copy prefix"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          k.scope === 'Admin'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            : k.scope === 'Full Validator Access'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {k.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {k.createdAt}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {k.lastUsedAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevokeKey(k.id, k.name)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Connected Integrations */}
      <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-4">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Ecosystem Integrations & Webhooks
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Connect reference management tools directly to your Validex account.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-white">Zotero Library</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Automatically verifies exported .bib and .ris bibliographies.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Zotero sync triggered!')}
              className="mt-4 text-xs font-semibold text-blue-600 hover:underline text-left"
            >
              Sync Now &rarr;
            </button>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-white">Mendeley Reference</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Disconnected
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Import collection citations and sync metadata flags.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Mendeley OAuth flow initiated.')}
              className="mt-4 text-xs font-semibold text-blue-600 hover:underline text-left"
            >
              Connect Mendeley &rarr;
            </button>
          </div>

          <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900 dark:text-white">Overleaf / LaTeX Hook</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Ready
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Trigger citation validation via GitHub webhook on git push.
              </p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Webhook configuration opened.')}
              className="mt-4 text-xs font-semibold text-blue-600 hover:underline text-left"
            >
              Configure Webhook &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 5. Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {generatedRawKey ? 'Key Generated Successfully' : 'Generate New API Key'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedRawKey ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Make sure to copy your API key now. You won&apos;t be able to see it again!
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={generatedRawKey}
                    className="w-full font-mono text-xs p-3 pr-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedRawKey, 'Full secret token')}
                    className="absolute right-2.5 top-2.5 p-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    title="Copy full key"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Key Description / Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Overleaf Citation Ingestion Hook"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Permission Scope
                  </label>
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as ApiKeyItem['scope'])}
                    className="w-full bg-gray-50 dark:bg-gray-800 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  >
                    <option value="Read-only">Read-only (Inspect documents & citations)</option>
                    <option value="Full Validator Access">Full Validator Access (Verify & submit references)</option>
                    <option value="Admin">Admin (Full workspace control & key management)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
