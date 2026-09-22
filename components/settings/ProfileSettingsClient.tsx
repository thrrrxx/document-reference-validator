'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Building,
  Briefcase,
  Globe,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Award,
  Calendar,
  Save
} from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { INITIAL_USER_PROFILE, UserProfile } from '@/lib/mock-settings';

export default function ProfileSettingsClient() {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
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
      showToast('Profile information saved successfully!');
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
        title="Account & Profile Settings"
        description="Manage your professional credentials, validator identity, and workspace details."
      />

      {/* 2. Top Credentials Banner */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none">
              JD
            </div>
            <button
              type="button"
              onClick={() => showToast('Avatar upload dialog opened.')}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              title="Change avatar"
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

        {/* Metric Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center min-w-[110px]">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {profile.verifiedCount}
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Refs Verified</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center min-w-[110px]">
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {profile.accuracyRate}%
            </span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Accuracy Rate</span>
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
    </div>
  );
}
