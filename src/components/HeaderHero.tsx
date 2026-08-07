import React from 'react';
import { SiteConfig } from '../types';
import { PhoneMockup } from './PhoneMockup';
import { Share2 } from 'lucide-react';

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
  return (
    <header className="relative pt-6 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Bar Navigation Actions for Mobile & Desktop */}
      <div className="flex items-center justify-between mb-8">
        {/* Brand Logo & Menu */}
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white font-quantum uppercase">
            {config.logoText || "ROSLEON"}
          </h1>
          <nav className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 text-sm sm:text-base font-bold">
            <a 
              href="#grupos"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('grupos')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Grupos
            </a>
            <a 
              href="#parcerias"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('parcerias')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Parcerias
            </a>
            <a 
              href="#youtube"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('youtube')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/30 bg-slate-900/80 text-slate-200 hover:text-amber-400 hover:border-amber-400/70 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Youtube
            </a>
            <a 
              href="#audiencia"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('audiencia')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-slate-900/90 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/80 hover:bg-slate-800/90 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm font-mono font-bold"
              title="Público em tempo real conectado ao vivo"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{totalOnlineCount.toLocaleString('pt-BR')} ao vivo</span>
            </a>
          </nav>
        </div>

        {/* Action Buttons: Share */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            title="Compartilhar página"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xs:inline">Compartilhar</span>
          </button>
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="flex flex-col items-center text-center space-y-5 max-w-3xl mx-auto">
        {/* Main Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
          ⚠️ Você pode estar{" "}
          <span className="text-amber-400 underline decoration-amber-500/40 decoration-4 underline-offset-4">
            pagando mais caro
          </span>{" "}
          por não estar no grupo!
        </h2>

        {/* Subheadline (Previous Main Title) */}
        <p className="text-slate-200 text-base sm:text-lg font-medium leading-relaxed max-w-2xl">
          Compre o que você quer pelos{" "}
          <span className="text-amber-400 font-bold">
            melhores preços
          </span>{" "}
          do mercado —{" "}
          <span className="text-amber-400 font-bold">
            com segurança!
          </span>
        </p>

        {/* Subheadline Categories */}
        <p className="text-slate-400 text-xs sm:text-sm font-semibold tracking-wider uppercase -mt-2">
          Fitness &nbsp;•&nbsp; Eletrônicos &nbsp;•&nbsp; Ofertas Gerais
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
              <span>🔥</span> Grupos separados por categoria:
            </p>

            {/* Categories Pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <a
                href="https://gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Fitness')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">💪</span>
                <span className="text-xs sm:text-sm leading-tight">Fitness</span>
              </a>
              <a
                href="https://gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Eletronicos')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">🔌</span>
                <span className="text-xs sm:text-sm leading-tight">Eletrônicos</span>
              </a>
              <a
                href="https://gruporosleon.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrackClick('Category Pill - Ofertas Gerais')}
                className="flex flex-col items-center justify-center text-center gap-1 py-2.5 px-1.5 sm:px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white font-bold hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className="text-lg">🛒</span>
                <span className="text-xs sm:text-sm leading-tight">Ofertas Gerais</span>
              </a>
            </div>
          </div>
        </div>

        {/* Yellow Pulsing Button */}
        <div className="pt-2 w-full max-w-lg">
          <a
            href="https://www.gruporosleon.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick('CTA Button')}
            className="group relative flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg tracking-tight shadow-[0_0_30px_rgba(250,204,21,0.6)] border-2 border-yellow-200 hover:shadow-[0_0_45px_rgba(250,204,21,0.85)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 animate-pulse text-center leading-snug"
          >
            <span>👉 TOQUE AQUI E VEJA COMO FUNCIONA NA PRÁTICA!</span>
          </a>
        </div>
      </div>
    </header>
  );
};
