import React from 'react';
import { SiteConfig } from '../types';
import { PhoneMockup } from './PhoneMockup';
import { Share2, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderHeroProps {
  config: SiteConfig;
  onOpenShare: () => void;
  onOpenEdit: () => void;
  onTrackClick: (linkName: string) => void;
  totalOnlineCount?: number;
}

export const HeaderHero: React.FC<HeaderHeroProps> = ({ 
  config, 
  onOpenShare, 
  onOpenEdit,
  onTrackClick,
  totalOnlineCount = 3840
}) => {
  const { t, formatNumber, language } = useLanguage();

  return (
    <header className="relative pt-6 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Bar Navigation Actions for Mobile & Desktop */}
      {/* Top Bar Navigation Actions for Mobile & Desktop */}
      <div className="flex flex-col gap-3.5 mb-8">
        {/* Row 1: Brand Logo & Right Action Buttons */}
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white font-quantum uppercase">
            {config.logoText || "ROSLEON"}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSelector />

            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              title="Compartilhar página"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">{t('share.button')}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Clean, Well-Aligned Navigation Pills */}
        <nav className="flex items-center justify-start sm:justify-center flex-wrap gap-2 text-xs sm:text-sm font-bold w-full">
          <a 
            href="#grupos"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('grupos')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            {t('nav.groups')}
          </a>
          <a 
            href="#parcerias"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('parcerias')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            {t('nav.partnerships')}
          </a>
          <a 
            href="#youtube"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('youtube')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            {t('nav.youtube')}
          </a>
          <a 
            href="#suporte"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('suporte')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/80 hover:bg-emerald-900/60 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center whitespace-nowrap"
          >
            {t('nav.support')}
          </a>
          <a 
            href="#audiencia"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('audiencia')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-slate-900/90 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/80 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm font-mono font-bold whitespace-nowrap"
            title="Público em tempo real conectado ao vivo"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{formatNumber(totalOnlineCount)} {t('nav.live')}</span>
          </a>
        </nav>
      </div>

      {/* Main Hero Container */}
      <div className="flex flex-col items-center text-center space-y-5 max-w-3xl mx-auto">
        {/* Main Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
          {language === 'pt' ? (
            <>
              <span>Você pode estar </span>
              <span className="text-amber-400 font-black">pagando mais caro</span>
              <span> por </span>
              <span className="text-amber-400 font-black">não estar no grupo!</span>
            </>
          ) : language === 'zh-CN' ? (
            <>
              <span>不在群里，你</span>
              <span className="text-amber-400 font-black">可能多花冤枉钱</span>
              <span>！</span>
            </>
          ) : (
            <>
              <span>You might be </span>
              <span className="text-amber-400 font-black">paying more</span>
              <span> by </span>
              <span className="text-amber-400 font-black">not being in the group!</span>
            </>
          )}
        </h2>

        {/* Subheadline */}
        <p className="text-slate-100 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
          {language === 'pt' ? (
            <>
              <span>Compre o que você quer pelos </span>
              <span className="text-amber-400 font-bold">melhores preços do mercado</span>
              <span> — com </span>
              <span className="text-amber-400 font-bold">segurança!</span>
            </>
          ) : language === 'zh-CN' ? (
            <>
              <span>以 </span>
              <span className="text-amber-400 font-bold">全网极优价格</span>
              <span> 购买心仪商品 — </span>
              <span className="text-amber-400 font-bold">100% 安全保障！</span>
            </>
          ) : (
            <>
              <span>Buy what you want at the </span>
              <span className="text-amber-400 font-bold">best market prices</span>
              <span> — with </span>
              <span className="text-amber-400 font-bold">safety!</span>
            </>
          )}
        </p>

        {/* Subheadline Categories */}
        <p className="text-slate-300 text-xs sm:text-sm font-semibold tracking-widest uppercase pt-1">
          {t('hero.categories')}
        </p>

        {/* Phone Video Mockup placed directly below the title */}
        <div className="w-full flex justify-center my-2">
          <PhoneMockup />
        </div>

        {/* Subtitle & Category Highlight Card */}
        <div id="grupos" className="w-full max-w-xl bg-slate-900/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5 shadow-xl text-left space-y-4">
          {/* Subtitle Header */}
          <div className="space-y-3">
            <p className="text-white font-extrabold text-base sm:text-lg flex items-center gap-2">
              <span>🔥</span> {t('hero.groupedByCategory')}
            </p>

            {/* Categories Pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <a
                href="https://pag.gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Fitness')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">💪</span>
                <span className="text-xs sm:text-sm leading-tight">{t('hero.catFitness')}</span>
              </a>
              <a
                href="https://pag.gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Eletronicos')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">🔌</span>
                <span className="text-xs sm:text-sm leading-tight">{t('hero.catElectronics')}</span>
              </a>
              <a
                href="https://pag.gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Ofertas Gerais')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">🛒</span>
                <span className="text-xs sm:text-sm leading-tight">{t('hero.catGeneral')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Yellow Pulsing Button */}
        <div className="pt-2 w-full max-w-lg">
          <a
            href="https://pag.gruporosleon.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick('CTA Button')}
            className="group relative flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg tracking-tight shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-200 hover:shadow-[0_0_45px_rgba(250,204,21,0.85)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 animate-pulse text-center leading-snug"
          >
            <span>{t('hero.ctaButton')}</span>
          </a>
        </div>
      </div>
    </header>
  );
};

