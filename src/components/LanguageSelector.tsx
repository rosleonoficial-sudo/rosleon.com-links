import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGE_OPTIONS, Language } from '../i18n/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.code === language) || LANGUAGE_OPTIONS[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-amber-400/60 text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
        aria-label="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">{currentOption.shortLabel}</span>
        <span className="sm:hidden font-mono text-[11px]">{currentOption.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl py-1 z-50 animate-fadeIn text-xs">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => {
                  setLanguage(option.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left font-semibold transition-colors ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-300 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{option.flag}</span>
                  <span>{option.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
