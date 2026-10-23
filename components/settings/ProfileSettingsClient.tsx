'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building,
  Briefcase,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Camera,
  ShieldCheck,
  Calendar,
  Save
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import AvatarUploadModal from './AvatarUploadModal';
import { INITIAL_USER_PROFILE, UserProfile } from '@/lib/mock-settings';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface ProfileSettingsClientProps {
  initialUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    createdAt?: string;
  } | null;
}


export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
}

export default function ProfileSettingsClient({ initialUser }: ProfileSettingsClientProps) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (initialUser) {
      const createdDate = initialUser.createdAt ? new Date(initialUser.createdAt) : new Date();
      const memberSinceFormatted = createdDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });
      return {
        ...INITIAL_USER_PROFILE,
        name: initialUser.name || 'Pengguna Validex',
        email: initialUser.email,
        role: initialUser.role === 'ADMIN' ? 'System Administrator' : (initialUser.role || 'Document Validator & Procurement'),
        avatarUrl: initialUser.image || null,
        image: initialUser.image || null,
        memberSince: memberSinceFormatted,
      };
    }
    return INITIAL_USER_PROFILE;
  });

  const [isLoadingUser, setIsLoadingUser] = useState(!initialUser);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type?: ToastType) => {
    let detectedType: ToastType = type || 'success';
    if (!type) {
      const lower = message.toLowerCase();
      if (
        lower.includes('gagal') ||
        lower.includes('error') ||
        lower.includes('failed') ||
        lower.includes('tidak') ||
        lower.includes('terlalu banyak')
      ) {
        detectedType = 'error';
      } else if (lower.includes('dialog') || lower.includes('opened') || lower.includes('info')) {
        detectedType = 'info';
      }
    }

    setToast({ message, type: detectedType });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Sync jika initialUser dari Server Component berubah
  useEffect(() => {
    if (initialUser) {
      const createdDate = initialUser.createdAt ? new Date(initialUser.createdAt) : new Date();
      const memberSinceFormatted = createdDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      });

      let extra = {
        organization: 'Validex Workspace',
        department: 'Procurement & Reference Validation',
        timezone: 'Asia/Jakarta (GMT+7)',
        bio: 'Bertanggung jawab dalam validasi dokumen pengadaan rantai pasok BOM, PR, PO, GRN, PI, dan PP.',
      };
      try {
        const saved = localStorage.getItem('user_profile_extra');
        if (saved) extra = { ...extra, ...JSON.parse(saved) };
      } catch {
        // ignore
      }

      setProfile((prev) => ({
        ...prev,
        name: initialUser.name || 'Pengguna Validex',
        email: initialUser.email,
        role: initialUser.role === 'ADMIN' ? 'System Administrator' : (initialUser.role || 'Document Validator & Procurement'),
        avatarUrl: initialUser.image !== undefined ? initialUser.image : prev.avatarUrl,
        image: initialUser.image !== undefined ? initialUser.image : prev.image,
        organization: extra.organization,
        department: extra.department,
        timezone: extra.timezone,
        bio: extra.bio,
        memberSince: memberSinceFormatted,
      }));
      setIsLoadingUser(false);
    }
  }, [initialUser]);

  // 2. Ambil data pengguna realtime dari PostgreSQL & dengarkan update
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.user) {
          const createdDate = json.user.createdAt ? new Date(json.user.createdAt) : new Date();
          const memberSinceFormatted = createdDate.toLocaleDateString('id-ID', {
            month: 'long',
            year: 'numeric',
          });

          let extra = {
            organization: 'Validex Workspace',
            department: 'Procurement & Reference Validation',
            timezone: 'Asia/Jakarta (GMT+7)',
            bio: 'Bertanggung jawab dalam validasi dokumen pengadaan rantai pasok BOM, PR, PO, GRN, PI, dan PP.',
          };
          try {
            const saved = localStorage.getItem('user_profile_extra');
            if (saved) extra = { ...extra, ...JSON.parse(saved) };
          } catch {
            // ignore
          }

          setProfile((prev) => ({
            ...prev,
            name: json.user.name || 'Pengguna Validex',
            email: json.user.email,
            role: json.user.role === 'ADMIN' ? 'System Administrator' : (json.user.role || 'Document Validator & Procurement'),
            avatarUrl: json.user.image || null,
            image: json.user.image || null,
            organization: extra.organization,
            department: extra.department,
            timezone: extra.timezone,
            bio: extra.bio,
            memberSince: memberSinceFormatted,
          }));
        }
      } catch (err) {
        console.error('Gagal mengambil data profil dari database:', err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUserProfile();

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ name?: string; email?: string; role?: string; image?: string | null }>;
      if (customEvent.detail) {
        setProfile((prev) => ({
          ...prev,
          name: customEvent.detail.name || prev.name,
          email: customEvent.detail.email || prev.email,
          role: customEvent.detail.role || prev.role,
          avatarUrl: customEvent.detail.image !== undefined ? customEvent.detail.image : prev.avatarUrl,
          image: customEvent.detail.image !== undefined ? customEvent.detail.image : prev.image,
        }));
      }
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  // 3. Simpan perubahan foto profil ke PostgreSQL
  const handleSaveAvatar = async (newImage: string | null) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: newImage,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl: newImage,
          image: newImage,
        }));

        showToast(
          newImage ? 'Foto profil berhasil diperbarui!' : 'Foto profil berhasil dihapus.',
          'success'
        );

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('user-profile-updated', {
              detail: {
                ...json.user,
                image: newImage,
              },
            })
          );
        }
      } else {
        const errorMsg = json.message || json.error || 'Gagal menyimpan foto profil';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan foto profil', 'error');
      throw err;
    }
  };

  // 4. Simpan perubahan field formulir ke PostgreSQL
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          role: profile.role,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        try {
          localStorage.setItem(
            'user_profile_extra',
            JSON.stringify({
              organization: profile.organization,
              department: profile.department,
              timezone: profile.timezone,
              bio: profile.bio,
            })
          );
        } catch {
          // ignore
        }

        showToast('Profil Berhasil Disimpan', 'success');
        if (typeof window !== 'undefined' && json.user) {
          window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: json.user }));
        }
      } else {
        const errorMsg = json.message || json.error || 'Gagal menyimpan profil';
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Gagal terhubung ke database', 'error');
    } finally {
      setIsSaving(false);
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
        title="Account & Profile Settings"
        description="Manage your professional credentials, validator identity, and workspace details."
      />

      {/* 2. Top Credentials Banner */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group">
            <div
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-20 h-20 rounded-2xl bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none uppercase overflow-hidden cursor-pointer relative transition-transform hover:scale-102"
              title="Klik untuk mengubah foto profil"
            >
              {profile.avatarUrl || profile.image ? (
                <img
                  src={profile.avatarUrl || profile.image || ''}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profile.name)
              )}
              {/* Subtle hover camera overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <Camera className="w-5 h-5 text-white drop-shadow-md" />
                <span className="text-[10px] text-white font-medium drop-shadow-md">Ubah</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              title="Ubah foto profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>


          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Certified Validator
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {profile.role} • {profile.organization}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Member since {profile.memberSince}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                {profile.timezone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Profile Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Personal & Professional Details
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            These credentials are displayed on audit certification reports and team logs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Professional Role / Title
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={profile.role}
                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Organization / Institution
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={profile.organization}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Department / Lab
            </label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              Primary Timezone
            </label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 text-sm px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
            >
              <option value="Asia/Jakarta (GMT+7)">Asia/Jakarta (GMT+7)</option>
              <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
              <option value="Europe/London (GMT+0)">Europe/London (GMT+0)</option>
              <option value="America/New_York (GMT-5)">America/New_York (GMT-5)</option>
            </select>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
            Research Bio & Specialization
          </label>
          <textarea
            rows={3}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-800/80 text-sm p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-xs shadow-blue-200 dark:shadow-none disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* 4. Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentImage={profile.avatarUrl || profile.image}
        userName={profile.name}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}

