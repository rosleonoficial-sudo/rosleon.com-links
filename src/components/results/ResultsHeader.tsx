import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Radio, CheckCircle2, Clock, AlertTriangle, AlertCircle, Handshake } from 'lucide-react';
import { ResultsStatusResponse } from '../../types';
import { PartnershipModal } from './PartnershipModal';

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
  const [isPartnershipModalOpen, setIsPartnershipModalOpen] = useState<boolean>(false);
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
  const ytStatus = status?.platforms?.youtube;
  const igStatus = status?.platforms?.instagram;
  const ttStatus = status?.platforms?.tiktok;

  const ytActive = ytStatus?.status === 'active';
  const igActive = igStatus?.status === 'active';
  const ttActive = ttStatus?.status === 'active' || ttStatus?.connected === true;

  const hasProblem = status?.hasProblem || status?.overallStatus === 'warning' || status?.overallStatus === 'error' || !ytActive || !igActive;

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

          {/* Action Buttons Group (Top Right) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPartnershipModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-black tracking-wide uppercase transition-all shadow-md shadow-emerald-950/30 cursor-pointer active:scale-95"
              title="Falar sobre parcerias comercial com a ROSLEON"
            >
              <Handshake className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">QUERO SER PARCEIRO</span>
              <span className="sm:hidden">PARCEIRO</span>
            </button>

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
        </div>

        {/* Title Banner & Monitoring Info Box */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[11px] font-bold tracking-wider uppercase">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
              <span>Portal Público de Consultas</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Consulta de Vídeos e Métricas de Desempenho
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl">
              Pesquise por marcas, campanhas ou produtos e consulte resultados consolidados no YouTube, Instagram e TikTok.
            </p>

            {/* Mobile Prominent Partnership CTA */}
            <div className="sm:hidden pt-1">
              <button
                onClick={() => setIsPartnershipModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600/30 via-cyan-600/30 to-blue-600/30 border border-emerald-500/50 text-emerald-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md"
              >
                <Handshake className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>QUERO SER PARCEIRO</span>
              </button>
            </div>
          </div>

          {/* Discrete Live Monitoring Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 text-left space-y-2.5 min-w-[300px] shadow-inner">
            <div className="flex items-center justify-between gap-3 text-xs">
              {!hasProblem ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ● MONITORAMENTO ATIVO
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>ATUALIZAÇÃO COM PROBLEMA</span>
                </div>
              )}

              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Próxima: <strong className="text-cyan-300">{countdownText}</strong>
              </span>
            </div>

            {hasProblem && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                <span className="truncate max-w-[200px]" title={status?.problemMessage || 'Falha na atualização automática. O catálogo está sendo mantido no último estado seguro.'}>
                  {status?.problemMessage || 'Instabilidade temporária na sincronização'}
                </span>
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-0.5 border-t border-slate-800/60">
              <span>Última atualização:</span>
              <strong className="text-slate-200">{timeAgoText}</strong>
            </div>

            {/* Network status badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ytActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  YouTube: {ytStatus?.totalContents || 652} vídeos
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-[10px] text-amber-300 font-medium" title={ytStatus?.lastError || 'Alerta na API do YouTube'}>
                  <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                  YouTube: {ytStatus?.totalContents || 652} (Protegido)
                </span>
              )}

              {igActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  Instagram: {igStatus?.totalContents || 183} reels
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-[10px] text-amber-300 font-medium" title={igStatus?.lastError || 'Alerta na API do Instagram'}>
                  <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                  Instagram: {igStatus?.totalContents || 183} (Protegido)
                </span>
              )}

              {ttActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  TikTok: {ttStatus?.totalContents ?? 0} vídeos
                </span>
              ) : (
                <a
                  href="/api/tiktok/login"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-[11px] text-cyan-200 font-semibold transition-colors shadow-sm"
                  title="Conectar Conta Oficial do TikTok via OAuth"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Conectar TikTok
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

      <PartnershipModal
        isOpen={isPartnershipModalOpen}
        onClose={() => setIsPartnershipModalOpen(false)}
      />
    </header>
  );
};
