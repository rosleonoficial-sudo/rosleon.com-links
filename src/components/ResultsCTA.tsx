import React from 'react';
import { BarChart3, ChevronRight, Zap, RefreshCw } from 'lucide-react';

interface ResultsCTAProps {
  onNavigateToResults: () => void;
}

export const ResultsCTA: React.FC<ResultsCTAProps> = ({ onNavigateToResults }) => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 group hover:border-cyan-400/60 transition-all duration-300">
        
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Text Content */}
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-bold tracking-wider uppercase">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Métricas em Tempo Real</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              QUER CONFERIR NOSSOS RESULTADOS?
            </h3>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Consulte vídeos, campanhas e métricas de desempenho dos conteúdos publicados pela <strong className="text-cyan-400 font-extrabold">ROSLEON</strong>.
            </p>

            {/* Additional info tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                YouTube + Instagram
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                Dados atualizados automaticamente
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-amber-400/90 font-semibold">
                <Zap className="w-3 h-3 text-amber-400" />
                TikTok em integração
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col sm:items-start lg:items-end gap-2">
            <button
              onClick={onNavigateToResults}
              className="relative group/btn inline-flex items-center justify-center gap-3 py-4 px-8 w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-cyan-500/25 active:scale-95 transition-all duration-300 border border-cyan-300/50 hover:scale-[1.02] cursor-pointer"
            >
              <BarChart3 className="w-5 h-5 text-slate-950 shrink-0" />
              <span className="tracking-wide uppercase font-black text-slate-950 whitespace-nowrap">
                CONSULTAR VÍDEOS E RESULTADOS
              </span>
              <ChevronRight className="w-5 h-5 text-slate-950 shrink-0 transition-transform group-hover/btn:translate-x-1 duration-200" />
            </button>
            <p className="text-[11px] text-slate-400 text-center sm:text-left lg:text-right font-medium">
              Acesso público • Pesquise por marca ou produto
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
