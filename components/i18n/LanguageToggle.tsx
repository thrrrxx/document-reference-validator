'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from './LanguageContext';

const OPTIONS: Array<{ code: Language; short: string; label: string }> = [
  { code: 'id', short: 'ID', label: 'Bahasa Indonesia' },
  { code: 'en', short: 'EN', label: 'English' },
];

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 transition text-xs font-semibold focus:outline-hidden"
        title={t('Pilih Bahasa (ID / EN)', 'Select Language (ID / EN)')}
        aria-label={t('Pilih Bahasa', 'Select Language')}
      >
        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="uppercase">{language}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 shadow-lg py-1.5 z-50">
          {OPTIONS.map((opt) => {
            const isActive = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => {
                  setLanguage(opt.code);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {opt.short}
                  </span>
                  <span>{opt.label}</span>
                </span>
                {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
