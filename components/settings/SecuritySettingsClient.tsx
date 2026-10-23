'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  LogOut,
  Download,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  X,
  QrCode
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { ActiveSession } from '@/lib/mock-settings';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

export default function SecuritySettingsClient() {
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorConfiguredDate, setTwoFactorConfiguredDate] = useState('12 Aug 2026');
  const [twoFactorSecretKey, setTwoFactorSecretKey] = useState('VALIDEX-7X9B-4KQZ-2M8P');
  const [backupCodes, setBackupCodes] = useState<string[]>([
    '8291-3819', '4910-2918', '7491-0284', '3918-2049', '5819-2041',
    '9182-4910', '2847-1920', '6391-0482', '1948-2910', '4829-1049'
  ]);
  const [isLoading2fa, setIsLoading2fa] = useState(true);

  // 2FA Modals State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isBackupCodesModalOpen, setIsBackupCodesModalOpen] = useState(false);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [verificationInputCode, setVerificationInputCode] = useState('');
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isRegeneratingCodes, setIsRegeneratingCodes] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Toast State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type?: ToastType) => {
    let detectedType: ToastType = type || 'success';
    if (!type) {
      const lower = message.toLowerCase();
      if (
        lower.includes('must') ||
        lower.includes('not match') ||
        lower.includes('error') ||
        lower.includes('gagal') ||
        lower.includes('fail') ||
        lower.includes('tidak')
      ) {
        detectedType = 'error';
      } else if (lower.includes('revoked') || lower.includes('dicabut') || lower.includes('keluar') || lower.includes('dialog')) {
        detectedType = 'info';
      }
    }

    setToast({ message, type: detectedType });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Muat konfigurasi 2FA dari PostgreSQL
  const load2faSettings = async () => {
    try {
      setIsLoading2fa(true);
      const res = await fetch('/api/auth/2fa', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setTwoFactorEnabled(json.twoFactorEnabled ?? true);
        if (json.configuredDate) setTwoFactorConfiguredDate(json.configuredDate);
        if (json.secretKey) setTwoFactorSecretKey(json.secretKey);
        if (Array.isArray(json.backupCodes)) setBackupCodes(json.backupCodes);
      }
    } catch (err) {
      console.error('Gagal memuat status 2FA:', err);
    } finally {
      setIsLoading2fa(false);
    }
  };

  // 2. Muat data sesi aktif dari PostgreSQL secara realtime
  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const res = await fetch('/api/auth/sessions', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.sessions)) {
        setSessions(json.sessions);
      }
    } catch (err) {
      console.error('Gagal memuat sesi aktif perangkat:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    load2faSettings();
    loadSessions();
  }, []);

  // Handler: Update Password riil di Database
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password successfully updated!', 'success');
      } else {
        showToast(json.message || 'Gagal memperbarui password.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke database.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handler: Verifikasi & Aktifkan 2FA
  const handleVerifyAndActivate2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInputCode || verificationInputCode.trim().length !== 6) {
      showToast('Harap masukkan 6 digit kode dari aplikasi authenticator.', 'error');
      return;
    }

    setIsVerifying2fa(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: verificationInputCode.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTwoFactorEnabled(true);
        setIsQrModalOpen(false);
        setVerificationInputCode('');
        showToast('2FA berhasil dikonfigurasi dan aktif!', 'success');
      } else {
        showToast(json.message || 'Kode verifikasi tidak valid.', 'error');
      }
    } catch {
      showToast('Gagal memverifikasi kode 2FA.', 'error');
    } finally {
      setIsVerifying2fa(false);
    }
  };

  // Handler: Nonaktifkan 2FA
  const handleConfirmDisable2fa = async () => {
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTwoFactorEnabled(json.twoFactorEnabled);
        setIsDisableConfirmOpen(false);
        showToast(json.message, 'info');
      } else {
        showToast(json.message || 'Gagal mengubah status 2FA.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  };

  // Handler: Regenerate Backup Codes
  const handleRegenerateBackupCodes = async () => {
    try {
      setIsRegeneratingCodes(true);
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-codes' }),
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.backupCodes)) {
        setBackupCodes(json.backupCodes);
        showToast('10 kode cadangan baru berhasil dibuat!', 'success');
      } else {
        showToast(json.message || 'Gagal membuat kode baru.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsRegeneratingCodes(false);
    }
  };

  // Handler: Copy Backup Codes ke Clipboard
  const handleCopyBackupCodes = () => {
    const text = `Validex Emergency Backup Codes:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes in a safe place.`;
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    showToast('Seluruh kode cadangan disalin ke clipboard!', 'info');
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  // Handler: Download Backup Codes file .txt
  const handleDownloadBackupCodes = () => {
    const content = `VALIDEX SECURITY BACKUP CODES\nGenerated on: ${new Date().toLocaleString()}\nAccount Protected\n\nCodes:\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n* Each code can be used once as an emergency backup.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validex-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File backup codes berhasil diunduh.', 'success');
  };

  // Handler: Copy Secret Key
  const handleCopySecretKey = () => {
    navigator.clipboard.writeText(twoFactorSecretKey);
    setCopiedSecret(true);
    showToast('Secret key disalin ke clipboard!', 'info');
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  // Handler: Cabut sesi perangkat tertentu
  const handleRevokeSession = async (id: string, device: string) => {
    try {
      const res = await fetch(`/api/auth/sessions?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        showToast(`Session for ${device} has been revoked.`, 'info');
      } else {
        showToast(json.message || 'Gagal mencabut sesi perangkat.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server untuk mencabut sesi.', 'error');
    }
  };

  // Handler: Log out all other devices
  const handleRevokeAllOther = async () => {
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke-others' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        showToast('Logged out of all other active sessions.', 'info');
      } else {
        showToast(json.message || 'Gagal mencabut sesi perangkat lain.', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-bottom-4 text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-gray-900 text-white dark:bg-[#181115] border-rose-500/50 shadow-rose-950/20'
              : toast.type === 'info'
              ? 'bg-gray-900 text-white dark:bg-[#101726] border-blue-500/50 shadow-blue-950/20'
              : 'bg-gray-900 text-white dark:bg-[#0c1a14] border-emerald-500/40 dark:border-emerald-500/40 shadow-emerald-950/20'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-500 shrink-0" />
          )}
          <span>{toast.message}</span>
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

            {/* Current Password */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter your current password"
                  className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  className="w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your new password"
                  className={`w-full bg-gray-50 dark:bg-gray-800/80 text-xs p-3 pr-10 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none disabled:opacity-50 cursor-pointer"
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

            {/* Dynamic 2FA Status Banner */}
            {twoFactorEnabled ? (
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
            ) : (
              <div className="mt-5 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    2FA is Currently Disabled
                  </span>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                    Your account has lower security. Enable 2FA to require an authenticator app code on login.
                  </p>
                </div>
              </div>
            )}

            {/* 2FA Configuration Panels */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Authenticator App
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {twoFactorEnabled ? `Configured on ${twoFactorConfiguredDate}` : 'Not configured'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {twoFactorEnabled ? 'Re-configure' : 'Set Up App'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block">
                    Emergency Backup Codes
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {twoFactorEnabled
                      ? `${backupCodes.length} of 10 single-use codes remaining`
                      : 'Unavailable while 2FA is disabled'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!twoFactorEnabled) {
                      showToast('Aktifkan 2FA terlebih dahulu untuk melihat backup codes.', 'info');
                    } else {
                      setIsBackupCodesModalOpen(true);
                    }
                  }}
                  className={`text-xs font-semibold ${
                    twoFactorEnabled
                      ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  View Codes
                </button>
              </div>
            </div>
          </div>

          {/* Toggle 2FA Button */}
          <div className="pt-2 flex justify-end">
            {twoFactorEnabled ? (
              <button
                type="button"
                onClick={() => setIsDisableConfirmOpen(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Disable Two-Factor Authentication
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enable Two-Factor Authentication</span>
              </button>
            )}
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
              {isLoadingSessions ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      <span>Memuat sesi aktif perangkat...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Tidak ada sesi perangkat lain yang aktif.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const isMobile =
                    /iphone|ipad|android|mobile/i.test(s.device) ||
                    /iphone|ipad|android/i.test(s.os);

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {isMobile ? (
                            <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Laptop className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                          <span>{s.device}</span>
                          {s.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
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
                        <span className="text-[11px] text-gray-400 font-mono">{s.ipAddress}</span>
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
                  );
                })
              )}
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex-shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Authenticator QR & Re-configure Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Set Up Authenticator App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>1Password</strong> to link your Validex account.
            </p>

            {/* Stylized QR Code Graphic */}
            <div className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/60">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200">
                <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none">
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="18" y="18" width="24" height="24" rx="2" fill="white" />
                  <rect x="24" y="24" width="12" height="12" rx="1" fill="#0F172A" />

                  <rect x="110" y="10" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="118" y="18" width="24" height="24" rx="2" fill="white" />
                  <rect x="124" y="24" width="12" height="12" rx="1" fill="#0F172A" />

                  <rect x="10" y="110" width="40" height="40" rx="4" fill="#0F172A" />
                  <rect x="18" y="118" width="24" height="24" rx="2" fill="white" />
                  <rect x="24" y="124" width="12" height="12" rx="1" fill="#0F172A" />

                  {/* QR Matrix Elements */}
                  <rect x="60" y="15" width="10" height="10" fill="#2563EB" />
                  <rect x="80" y="15" width="15" height="10" fill="#0F172A" />
                  <rect x="60" y="35" width="15" height="15" fill="#0F172A" />
                  <rect x="85" y="35" width="10" height="10" fill="#2563EB" />
                  <rect x="15" y="60" width="10" height="15" fill="#0F172A" />
                  <rect x="35" y="60" width="15" height="10" fill="#2563EB" />
                  <rect x="60" y="60" width="15" height="15" fill="#0F172A" />
                  <rect x="85" y="60" width="15" height="15" fill="#2563EB" />
                  <rect x="110" y="60" width="15" height="10" fill="#0F172A" />
                  <rect x="135" y="60" width="15" height="15" fill="#0F172A" />
                  <rect x="15" y="85" width="15" height="15" fill="#2563EB" />
                  <rect x="40" y="85" width="10" height="10" fill="#0F172A" />
                  <rect x="60" y="85" width="10" height="15" fill="#2563EB" />
                  <rect x="80" y="85" width="20" height="10" fill="#0F172A" />
                  <rect x="110" y="85" width="10" height="15" fill="#2563EB" />
                  <rect x="130" y="85" width="15" height="10" fill="#0F172A" />
                  <rect x="60" y="110" width="15" height="10" fill="#0F172A" />
                  <rect x="85" y="110" width="10" height="15" fill="#2563EB" />
                  <rect x="110" y="110" width="15" height="15" fill="#0F172A" />
                  <rect x="135" y="110" width="15" height="10" fill="#2563EB" />
                  <rect x="60" y="135" width="20" height="15" fill="#2563EB" />
                  <rect x="90" y="135" width="15" height="10" fill="#0F172A" />
                  <rect x="115" y="135" width="10" height="15" fill="#2563EB" />
                  <rect x="135" y="135" width="15" height="15" fill="#0F172A" />
                </svg>
              </div>
              <span className="text-[11px] text-gray-400 mt-2">Scan with Authenticator</span>
            </div>

            {/* Secret Key with Copy */}
            <div>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                Or enter this Secret Key manually:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={twoFactorSecretKey}
                  className="w-full bg-gray-50 dark:bg-gray-800 text-xs font-mono font-bold p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleCopySecretKey}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition flex items-center gap-1 cursor-pointer"
                  title="Copy Secret"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 6-Digit Verification Code Form */}
            <form onSubmit={handleVerifyAndActivate2fa} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Enter 6-digit code from authenticator:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationInputCode}
                  onChange={(e) => setVerificationInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  className="w-full text-center text-lg tracking-[0.5em] font-mono font-bold bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2fa || verificationInputCode.length !== 6}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isVerifying2fa ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Emergency Backup Codes Modal */}
      {isBackupCodesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Emergency Backup Codes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupCodesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Save these single-use codes safely. If you lose access to your authenticator app, each code can be used once to access your workspace.
            </p>

            {/* Grid of Codes */}
            <div className="grid grid-cols-2 gap-2.5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 p-2 rounded-lg bg-white dark:bg-gray-800 text-center border border-gray-100 dark:border-gray-700/70"
                >
                  <span className="text-[10px] text-gray-400 mr-2">{index + 1}.</span>
                  {code}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleRegenerateBackupCodes}
                disabled={isRegeneratingCodes}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingCodes ? 'animate-spin' : ''}`} />
                <span>Regenerate Codes</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Disable 2FA Confirmation Modal */}
      {isDisableConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Disable Two-Factor Authentication?
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Disabling 2FA removes the extra layer of security. Your account will only be protected by your password.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDisableConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisable2fa}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                Yes, Disable 2FA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
