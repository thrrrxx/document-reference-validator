'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  Camera,
  Loader2,
  ZoomIn,
  RefreshCw,
  Crop,
} from 'lucide-react';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string | null;
  userName: string;
  onSave: (newImage: string | null) => Promise<void>;
}

// Preset modern SVG avatars with vibrant palettes & clean designs (already 1:1 square)
const PRESET_AVATARS: { id: string; name: string; svg: string }[] = [
  {
    id: 'preset-blue-tech',
    name: 'Tech Specialist',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%232563EB"/><circle cx="50" cy="40" r="18" fill="%23DBEAFE"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23BFDBFE"/><circle cx="43" cy="38" r="2.5" fill="%231E40AF"/><circle cx="57" cy="38" r="2.5" fill="%231E40AF"/><path d="M46 45c2 2 6 2 8 0" stroke="%231E40AF" stroke-width="2" stroke-linecap="round"/><rect x="36" y="20" width="28" height="6" rx="3" fill="%231E40AF"/></svg>`,
  },
  {
    id: 'preset-emerald-audit',
    name: 'Quality Auditor',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23059669"/><circle cx="50" cy="40" r="18" fill="%23D1FAE5"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23A7F3D0"/><circle cx="43" cy="38" r="2.5" fill="%23065F46"/><circle cx="57" cy="38" r="2.5" fill="%23065F46"/><path d="M46 46c2 1.5 6 1.5 8 0" stroke="%23065F46" stroke-width="2" stroke-linecap="round"/><circle cx="68" cy="62" r="10" fill="%2334D399"/><path d="M65 62l2 2 4-4" stroke="%23064E3B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'preset-indigo-analyst',
    name: 'Lead Analyst',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%234F46E5"/><circle cx="50" cy="40" r="18" fill="%23E0E7FF"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23C7D2FE"/><circle cx="44" cy="38" r="2.5" fill="%233730A3"/><circle cx="56" cy="38" r="2.5" fill="%233730A3"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%233730A3" stroke-width="2" stroke-linecap="round"/><path d="M38 31c6-4 18-4 24 0" stroke="%23312E81" stroke-width="4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-amber-exec',
    name: 'Procurement Lead',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23D97706"/><circle cx="50" cy="40" r="18" fill="%23FEF3C7"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23FDE68A"/><circle cx="43" cy="38" r="2.5" fill="%2392400E"/><circle cx="57" cy="38" r="2.5" fill="%2392400E"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%2392400E" stroke-width="2" stroke-linecap="round"/><circle cx="68" cy="28" r="6" fill="%23F59E0B"/><path d="M68 25v6M65 28h6" stroke="%23FFF" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'preset-violet-creative',
    name: 'Security Officer',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%237C3AED"/><circle cx="50" cy="40" r="18" fill="%23EDE9FE"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23DDD6FE"/><circle cx="43" cy="38" r="2.5" fill="%235B21B6"/><circle cx="57" cy="38" r="2.5" fill="%235B21B6"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%235B21B6" stroke-width="2" stroke-linecap="round"/><path d="M50 21l8 4v7c0 5-3.5 10-8 12-4.5-2-8-7-8-12v-7l8-4z" fill="%23A78BFA" opacity="0.4"/></svg>`,
  },
  {
    id: 'preset-rose-validator',
    name: 'Senior Validator',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23E11D48"/><circle cx="50" cy="40" r="18" fill="%23FFE4E6"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23FECDD3"/><circle cx="43" cy="38" r="2.5" fill="%239F1239"/><circle cx="57" cy="38" r="2.5" fill="%239F1239"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%239F1239" stroke-width="2" stroke-linecap="round"/><circle cx="34" cy="28" r="6" fill="%23FB7185"/></svg>`,
  },
  {
    id: 'preset-cyan-coder',
    name: 'System Admin',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%230891B2"/><circle cx="50" cy="40" r="18" fill="%23CFFAFE"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23A5F3FC"/><circle cx="43" cy="38" r="2.5" fill="%23155E75"/><circle cx="57" cy="38" r="2.5" fill="%23155E75"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%23155E75" stroke-width="2" stroke-linecap="round"/><rect x="36" y="24" width="28" height="4" rx="2" fill="%23164E63"/></svg>`,
  },
  {
    id: 'preset-slate-minimal',
    name: 'Executive Minimal',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23334155"/><circle cx="50" cy="40" r="18" fill="%23F1F5F9"/><path d="M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="%23E2E8F0"/><circle cx="43" cy="38" r="2.5" fill="%231E293B"/><circle cx="57" cy="38" r="2.5" fill="%231E293B"/><path d="M46 45c2 1.8 6 1.8 8 0" stroke="%231E293B" stroke-width="2" stroke-linecap="round"/><circle cx="70" cy="70" r="10" fill="%233B82F6"/><path d="M70 66v8M66 70h8" stroke="%23FFF" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
];

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Pemotongan Presisi Rasio 1:1 (Center-Crop) & Kompresi Optimal:
 * - Menghitung bidang bujur sangkar (1:1) tepat di bagian tengah gambar sumber.
 * - Menerapkan faktor zoom bila pengguna ingin memperbesar framing wajah.
 * - Menghasilkan kanvas persegi sempurna 512x512 piksel berformat WebP/JPEG.
 */
function compressAndResizeImage(
  file: File,
  targetDimension = 512,
  quality = 0.88,
  zoom = 1.0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Ambil dimensi terkecil agar menjadi rasio 1:1 bujur sangkar sempurna
        const baseSquare = Math.min(img.width, img.height);
        const safeZoom = Math.max(1.0, Math.min(zoom, 3.0));
        const cropSize = baseSquare / safeZoom;

        // Titik potong tengah (Center Crop 1:1)
        const sourceX = Math.max(0, (img.width - cropSize) / 2);
        const sourceY = Math.max(0, (img.height - cropSize) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context tidak tersedia'));
        }

        // Kualitas render halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Gambar dipotong 1:1 simetris ke kanvas 512x512
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          cropSize,
          cropSize,
          0,
          0,
          targetDimension,
          targetDimension
        );

        // Export ke WebP (atau JPEG sebagai fallback)
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl.startsWith('data:image/webp')) {
            return resolve(dataUrl);
          }
        } catch {
          // fallback
        }

        const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(fallbackDataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dipotong 1:1'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  currentImage,
  userName,
  onSave,
}: AvatarUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or currentImage changes
  useEffect(() => {
    if (isOpen) {
      setPreviewImage(currentImage || null);
      setSelectedFile(null);
      setZoomLevel(1.0);
      setErrorMessage(null);
      setActiveTab('upload');
    }
  }, [isOpen, currentImage]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File, zoom = 1.0) => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format gambar harus berupa JPG, PNG, WEBP, atau GIF.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimal ukuran gambar adalah 5MB.');
      return;
    }

    setSelectedFile(file);
    setIsProcessingFile(true);
    try {
      const croppedDataUrl = await compressAndResizeImage(file, 512, 0.88, zoom);
      setPreviewImage(croppedDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses gambar 1:1.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setZoomLevel(1.0);
      handleProcessFile(file, 1.0);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (selectedFile) {
      try {
        const croppedDataUrl = await compressAndResizeImage(selectedFile, 512, 0.88, newZoom);
        setPreviewImage(croppedDataUrl);
      } catch {
        // ignore
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setZoomLevel(1.0);
      handleProcessFile(file, 1.0);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setZoomLevel(1.0);
    setErrorMessage(null);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave(previewImage);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan foto profil ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getInitials(userName);
  const isChanged = previewImage !== (currentImage || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 id="avatar-modal-title" className="text-base font-bold text-gray-900 dark:text-white">
                Foto Profil Pengguna
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Format rasio 1:1 persegi sempurna untuk semua tampilan avatar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Preview Showcase */}
          <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              {/* Square / Banner preview (1:1 Ratio) */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none overflow-hidden uppercase aspect-square">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
              </div>

              {/* Circular / Navbar / Sidebar preview (1:1 Circle) */}
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Pratinjau
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Crop className="w-2.5 h-2.5" />
                    1:1 Square
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800 overflow-hidden uppercase aspect-square">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                      {userName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {previewImage ? 'Foto Kustom 1:1 Aktif' : 'Avatar Inisial'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action: Reset to initials */}
            {previewImage && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Foto
              </button>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tabs: Upload File vs Presets */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Unggah Foto dari Perangkat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'presets'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Pilih Avatar Preset
            </button>
          </div>

          {/* TAB 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
                id="avatar-file-upload-input"
              />

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/40'
                }`}
              >
                {isProcessingFile ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      Memotong ke rasio 1:1 & memproses gambar...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Klik untuk memilih berkas foto, atau seret & lepas ke sini
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Otomatis dipotong simetris ke <span className="font-semibold text-blue-600 dark:text-blue-400">Rasio 1:1</span> (Maks. 5MB)
                    </p>
                    <button
                      type="button"
                      className="mt-3 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 pointer-events-none"
                    >
                      Pilih dari Komputer
                    </button>
                  </>
                )}
              </div>

              {/* Framing / Zoom Adjustment when a file is selected */}
              {selectedFile && (
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Sesuaikan Zoom / Framing 1:1
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                      {zoomLevel.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1.0x (Penuh)</span>
                    <span>1.7x</span>
                    <span>2.5x (Close-up)</span>
                  </div>
                </div>
              )}

              {/* Info text */}
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                💡 <span className="font-semibold text-gray-700 dark:text-gray-200">Rasio 1:1 Otomatis:</span> Berkas foto otomatis dipotong ke rasio persegi 1:1 terpusat (center-crop) dan dikompresi ke 512×512 piksel sehingga pas sempurna pada tampilan avatar bulat maupun kotak tanpa terdistorsi.
              </p>
            </div>
          )}

          {/* TAB 2: Preset Avatars */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih salah satu karakter avatar profesional rasio 1:1:
              </p>

              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = previewImage === preset.svg;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPreviewImage(preset.svg);
                        setSelectedFile(null);
                        setZoomLevel(1.0);
                        setErrorMessage(null);
                      }}
                      className={`relative p-2 rounded-xl border flex flex-col items-center gap-1.5 transition group cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs aspect-square">
                        <img
                          src={preset.svg}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || isProcessingFile || !isChanged}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition ${
              isSaving || isProcessingFile || !isChanged
                ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-blue-200 dark:shadow-none cursor-pointer'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan & Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
