'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ShieldCheck, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          action?: string;
          cData?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onloadTurnstileCallback?: () => void;
  }
}

// Cloudflare Always Passes Test Sitekey untuk pengembangan lokal / testing
const TEST_SITE_KEY = '1x00000000000000000000AA';

export interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export default function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  action,
  theme = 'auto',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

  const renderWidget = () => {
    if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
      return;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        action,
        callback: (token: string) => {
          setHasError(false);
          onSuccess(token);
        },
        'error-callback': (code) => {
          console.warn('[Turnstile Widget] Error callback triggered:', code);
          setHasError(true);
          onError?.(code);
        },
        'expired-callback': () => {
          console.warn('[Turnstile Widget] Token expired');
          onExpire?.();
        },
      });

      widgetIdRef.current = id;
      setIsRendered(true);
    } catch (err) {
      console.error('[Turnstile Widget] Render failure:', err);
      setHasError(true);
    }
  };

  useEffect(() => {
    // Jika script sudah ada dan ter-load di window
    if (window.turnstile && !widgetIdRef.current) {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [theme, isScriptLoaded]);

  const handleManualReset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setHasError(false);
    } else {
      renderWidget();
    }
  };

  return (
    <div className={`my-3 flex flex-col items-center justify-center ${className}`}>
      {/* Cloudflare Turnstile Official Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          setIsScriptLoaded(true);
          renderWidget();
        }}
      />

      {/* Turnstile Container */}
      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center w-full"
      />

      {/* Fallback / Error Alert */}
      {hasError && (
        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Gagal memuat proteksi CAPTCHA Cloudflare.</span>
          <button
            type="button"
            onClick={handleManualReset}
            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5 ml-1"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      )}

      {/* Info indicator */}
      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Dilindungi oleh <strong>Cloudflare Turnstile</strong> DDoS & Bot Shield</span>
      </div>
    </div>
  );
}
