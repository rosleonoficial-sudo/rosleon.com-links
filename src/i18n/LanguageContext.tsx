import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pt } from './translations/pt';
import { en } from './translations/en';
import { zhCN } from './translations/zh-CN';

export type Language = 'pt' | 'en' | 'zh-CN';

export interface LanguageOption {
  code: Language;
  label: string;
  shortLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'pt', label: 'Português', shortLabel: 'PT', flag: '🇧🇷' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { code: 'zh-CN', label: '中文（简体）', shortLabel: '中文', flag: '🇨🇳' },
];

const STORAGE_KEY = 'app_language';

const translations = {
  pt,
  en,
  'zh-CN': zhCN,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  try {
    // 1. Check user manual preference stored in localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'pt' || saved === 'en' || saved === 'zh-CN')) {
      return saved as Language;
    }

    // 2. Browser language detection
    const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();

    if (browserLang.startsWith('pt')) {
      return 'pt';
    }
    if (browserLang.startsWith('zh')) {
      return 'zh-CN';
    }
  } catch (e) {
    console.error('Error detecting language:', e);
  }

  // 3. Fallback to English
  return 'en';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectBrowserLanguage);

  useEffect(() => {
    // Update HTML lang attribute dynamically
    const htmlLangMap: Record<Language, string> = {
      pt: 'pt-BR',
      en: 'en',
      'zh-CN': 'zh-CN',
    };
    document.documentElement.lang = htmlLangMap[language] || 'en';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[language] || translations.en;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English if key missing in current language
        let fallback: any = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path; // Return key string as last resort
          }
        }
        return typeof fallback === 'string' ? fallback : path;
      }
    }

    return typeof current === 'string' ? current : path;
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
    const localeMap: Record<Language, string> = {
      pt: 'pt-BR',
      en: 'en-US',
      'zh-CN': 'zh-CN',
    };
    return new Intl.NumberFormat(localeMap[language] || 'en-US', options).format(num);
  };

  const formatPercent = (num: number): string => {
    const localeMap: Record<Language, string> = {
      pt: 'pt-BR',
      en: 'en-US',
      'zh-CN': 'zh-CN',
    };
    return new Intl.NumberFormat(localeMap[language] || 'en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatNumber,
        formatPercent,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
