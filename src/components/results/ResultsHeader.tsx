import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Radio, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ResultsStatusResponse } from '../../types';

interface ResultsHeaderProps {
  onNavigateHome: () => void;
  status: ResultsStatusResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  onNavigateHome,
  status,
  onRefresh,
  isRefreshing
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const lastAutoTriggerRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute time ago based on REAL backend timestamp
  let timeAgoText = 'Sincronizando...';
  let countdownText = '00:00';

  if (status?.lastSyncedAt) {
    const lastSyncedTime = new Date(status.lastSyncedAt).getTime();
    if (!isNaN(lastSyncedTime)) {
      const diffSec = Math.max(0, Math.floor((now - lastSyncedTime) / 1000));
      if (diffSec < 60) {
        timeAgoText = `há ${diffSec} s`;
      } else if (diffSec < 3600) {
        const minutesAgo = Math.floor(diffSec / 60);
        const secondsAgo = diffSec % 60;
        timeAgoText = `há ${minutesAgo} min ${secondsAgo} s`;
      } else {
        const hoursAgo = Math.floor(diffSec / 3600);
        const minutesAgo = Math.floor((diffSec % 3600) / 60);
        timeAgoText = `há ${hoursAgo} h ${minutesAgo} min`;
      }
    }
  }

  // Compute real countdown to next sync
  if (status?.nextSyncAt) {
    const nextSyncTime = new Date(status.nextSyncAt).getTime();
    if (!isNaN(nextSyncTime)) {
      const remainingSec = Math.max(0, Math.floor((nextSyncTime - now) / 1000));
      const rMin = Math.floor(remainingSec / 60);
      const rSec = remainingSec % 60;
      countdownText = `${String(rMin).padStart(2, '0')}:${String(rSec).padStart(2, '0')}`;
    }
  }

  // Auto trigger refresh when countdown reaches 00:00
  useEffect(() => {
    if (!status?.nextSyncAt) return;
    const nextSyncTime = new Date(status.nextSyncAt).getTime();
    if (isNaN(nextSyncTime)) return;
    const remainingSec = Math.floor((nextSyncTime - now) / 1000);

    if (remainingSec <= 0 && lastAutoTriggerRef.current !== status.nextSyncAt) {
      lastAutoTriggerRef.current = status.nextSyncAt;
      onRefresh();
    }
  }, [now, status?.nextSyncAt, onRefresh]);

  // Determine system monitoring status
  const ytActive = status?.platforms?.youtube?.status === 'active';
  const igActive = status?.platforms?.instagram?.status === 'active';

  let systemState: 'active' | 'delayed' | 'error' = 'active';

  if (!status || status.success === false || !ytActive || !igActive) {
    systemState = 'error';
  } else if (status.nextSyncAt) {
    const nextSyncTime = new Date(status.nextSyncAt).getTime();
    if (!isNaN(nextSyncTime) && now > nextSyncTime + 120000) {
      systemState = 'delayed';
    }
  }

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        
        {/* Top Nav Row */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition-all duration-200 border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Voltar ao Media Kit</span>
          </button>

          {/* Logo Brand Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-widest uppercase">
              ROSLEON <span className="text-cyan-400">| RESULTADOS</span>
            </span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Atualizar Dados</span>
          </button>
        </div>

        {/* Title Banner & Monitoring Info Box */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[11px] font-bold tracking-wider uppercase">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
              <span>Portal Público de Consultas</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Consulta de Vídeos e Métricas de Desempenho
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Pesquise por marcas, campanhas ou produtos e consulte resultados consolidados no YouTube e Instagram.
            </p>
          </div>

          {/* Discrete Live Monitoring Box */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-4 text-left space-y-2.5 min-w-[280px] shadow-inner">
            <div className="flex items-center justify-between gap-3 text-xs">
              {systemState === 'active' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ● MONITORAMENTO ATIVO
                </span>
              )}
              {systemState === 'delayed' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  ● ATUALIZAÇÃO ATRASADA
                </span>
              )}
              {systemState === 'error' && (
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ● MONITORAMENTO COM PROBLEMA
                </span>
              )}

              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Próxima: <strong className="text-cyan-300">{countdownText}</strong>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-0.5 border-t border-slate-800/60">
              <span>Última atualização:</span>
              <strong className="text-slate-200">{timeAgoText}</strong>
            </div>

            {/* Network status badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ytActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  YouTube: Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-rose-500/30 text-[10px] text-rose-300 font-medium">
                  <XCircle className="w-2.5 h-2.5 text-rose-400" />
                  YouTube: Inativo
                </span>
              )}

              {igActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Instagram: Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-rose-500/30 text-[10px] text-rose-300 font-medium">
                  <XCircle className="w-2.5 h-2.5 text-rose-400" />
                  Instagram: Inativo
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-[10px] text-amber-300 font-medium">
                TikTok: Em integração
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

