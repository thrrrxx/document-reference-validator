'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Download,
  Trash2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { INITIAL_SESSIONS, ActiveSession } from '@/lib/mock-settings';

export default function SecuritySettingsClient() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password successfully updated!');
    }, 900);
  };

  const handleRevokeSession = (id: string, device: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast(`Session for ${device} has been revoked.`);
  };

  const handleRevokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast('Logged out of all other active sessions.');
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
        title="Security & Session Controls"
        description="Safeguard your authentication credentials, configure multi-factor verification, and audit active devices."
      />

      {/* 2. Password Form & 2FA Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Change Password Form */}
        <form
          onSubmit={handlePasswordChange}
          className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Password
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ensure your account uses a strong, unique passphrase.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Current Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* Right: Two-Factor Authentication (2FA) */}
        <div className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Require an additional TOTP verification code from an authenticator app upon login.
              </p>
            </div>

            <div className="mt-5 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  2FA is Currently Enabled
                </span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                  Your account is protected via Google Authenticator / 1Password TOTP codes.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Authenticator App
                  </span>
                  <span className="text-[11px] text-gray-400">Configured on 12 Aug 2026</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Re-scan QR code dialog opened.')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Re-configure
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Emergency Backup Codes
                  </span>
                  <span className="text-[11px] text-gray-400">8 of 10 single-use codes remaining</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Backup codes: 8291-3819, 4910-2918...')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View Codes
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                showToast(twoFactorEnabled ? '2FA disabled (warning: account less secure).' : '2FA enabled!');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              {twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Sessions Management */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Active Browser & Device Sessions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Devices currently authenticated to your Validex workspace.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeAllOther}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out All Other Devices</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50/75 dark:bg-gray-800/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-3.5">Device & Browser</th>
                <th className="px-6 py-3.5">Operating System</th>
                <th className="px-6 py-3.5">Location & IP</th>
                <th className="px-6 py-3.5">Last Activity</th>
                <th className="px-6 py-3.5 text-right">Session Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>{s.device}</span>
                      {s.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                          Current Device
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 block mt-0.5">{s.browser}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {s.os}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800 dark:text-gray-200 block">{s.location}</span>
                    <span className="text-[11px] text-gray-400">{s.ipAddress}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {s.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {s.isCurrent ? (
                      <span className="text-[11px] font-semibold text-gray-400">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(s.id, s.device)}
                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="p-6 sm:p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Danger Zone
          </h3>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
            Irreversible actions affecting your validation datasets and workspace access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block">
              Export Complete Audit Workspace Archive
            </span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Download all citation validation history, logs, and document matrices as a ZIP archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => showToast('Preparing workspace audit data archive for download...')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
}
