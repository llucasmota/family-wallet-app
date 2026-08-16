'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';

export interface LanguageSwitcherProps {
  variant?: 'pill' | 'menu';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'pill',
  className = '',
}) => {
  const pathname = usePathname();
  const router = useRouter();

  // Detect current locale based on path
  const isEnglish = pathname.startsWith('/en');
  const currentLocale = isEnglish ? 'en' : 'pt-BR';

  const handleSelectLocale = (targetLocale: 'pt-BR' | 'en') => {
    if (targetLocale === currentLocale) return;

    // Set cookie for persistence (1 year)
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;

    let targetPath = '/';
    if (targetLocale === 'en') {
      targetPath = pathname.startsWith('/en') ? pathname : `/en${pathname === '/' ? '' : pathname}`;
    } else {
      targetPath = pathname.replace(/^\/en/, '') || '/';
    }

    // Force full page reload to completely re-hydrate Server Components and getMessages()
    window.location.href = targetPath;
  };

  if (variant === 'menu') {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-2.5 py-1 flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-primary" />
          Idioma / Language
        </span>
        <button
          type="button"
          onClick={() => handleSelectLocale('pt-BR')}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-m3-md text-xs transition-colors ${
            currentLocale === 'pt-BR'
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🇧🇷</span>
            <span>Português (Brasil)</span>
          </span>
          {currentLocale === 'pt-BR' && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
        <button
          type="button"
          onClick={() => handleSelectLocale('en')}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-m3-md text-xs transition-colors ${
            currentLocale === 'en'
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🇺🇸</span>
            <span>English (US)</span>
          </span>
          {currentLocale === 'en' && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      </div>
    );
  }

  // Pill / Segmented variant
  return (
    <div
      className={`inline-flex items-center rounded-m3-full border border-outline-variant/30 bg-surface dark:bg-[#141816] p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <button
        type="button"
        onClick={() => handleSelectLocale('pt-BR')}
        className={`flex items-center gap-1 rounded-m3-full px-2 py-0.5 text-[11px] font-bold transition-all ${
          currentLocale === 'pt-BR'
            ? 'bg-primary text-white shadow-m3-1 scale-105'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
        title="Mudar para Português"
      >
        <span className="text-xs">🇧🇷</span>
        <span>PT</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectLocale('en')}
        className={`flex items-center gap-1 rounded-m3-full px-2 py-0.5 text-[11px] font-bold transition-all ${
          currentLocale === 'en'
            ? 'bg-primary text-white shadow-m3-1 scale-105'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
        title="Switch to English"
      >
        <span className="text-xs">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
};
