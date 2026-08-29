import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, ChevronDown, ChevronUp, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export type BrandMetricOption = 'views' | 'likes' | 'comments' | 'shares' | 'engagement';

export interface BrandRankingItem {
  rank: number;
  brand: string;
  contentCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementScore: number;
  displayValue: string;
}

const LOADING_MESSAGES = [
  'Calculando ranking de marcas...',
  'Consolidando métricas...',
  'Organizando marcas...',
  'Preparando ranking...'
];

export const BrandRankingWidget: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<BrandMetricOption>('views');
  const [rankingData, setRankingData] = useState<BrandRankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [msgIndex, setMsgIndex] = useState<number>(0);
  const [showFullRanking, setShowFullRanking] = useState<boolean>(false);

  const fetchRanking = useCallback((metric: BrandMetricOption) => {
    setLoading(true);
    setError(false);
    setSecondsElapsed(0);
    setMsgIndex(0);

    fetch(`/api/brands/ranking?metric=${metric}`)
      .then(res => {
        if (!res.ok) throw new Error('HTTP Error');
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.ranking)) {
          setRankingData(data.ranking);
          setError(false);
        } else {
          setError(true);
        }
      })
      .catch(err => {
        console.warn('Erro ao carregar ranking de marcas:', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRanking(selectedMetric);
  }, [selectedMetric, fetchRanking]);

  // Loading Timer & Rotating Message Effect
  useEffect(() => {
    if (!loading) return;

    const intervalTimer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    const msgTimer = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(intervalTimer);
      clearInterval(msgTimer);
    };
  }, [loading]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const top4 = rankingData.slice(0, 4);
  const restRanking = rankingData.slice(4);

  const metricButtons: { key: BrandMetricOption; label: string; icon: React.ReactNode }[] = [
    { key: 'views', label: 'Visualizações', icon: <Eye className="w-3.5 h-3.5" /> },
    { key: 'likes', label: 'Curtidas', icon: <ThumbsUp className="w-3.5 h-3.5" /> },
    { key: 'comments', label: 'Comentários', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'shares', label: 'Compartilhamentos', icon: <Share2 className="w-3.5 h-3.5" /> },
    { key: 'engagement', label: 'Engajamento', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 1º LUGAR', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' };
    if (rank === 2) return { text: '🥈 2º LUGAR', bg: 'bg-slate-300/20 text-slate-200 border-slate-400/50' };
    if (rank === 3) return { text: '🥉 3º LUGAR', bg: 'bg-amber-700/20 text-amber-400 border-amber-700/50' };
    return { text: '4º LUGAR', bg: 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' };
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Header & Metric Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
              RANKING DE MARCAS
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Consolidado de todas as métricas reais por fabricante
            </p>
          </div>
        </div>

        {/* Metric Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          {metricButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setSelectedMetric(btn.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedMetric === btn.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Professional Loading State OR Error State OR Ranking Cards */}
      {loading ? (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-6 sm:p-8 space-y-4 text-center">
          
          {/* Rotating Message & Timer */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
              <span>{LOADING_MESSAGES[msgIndex]}</span>
            </div>
            <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md font-mono text-cyan-300 font-extrabold text-xs">
              {formatTimer(secondsElapsed)}
            </span>
          </div>

          {/* Indeterminate Progress Bar */}
          <div className="w-full max-w-md mx-auto h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 relative">
            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full animate-indeterminate-slide" />
          </div>

          {/* Alert if taking longer than 20 seconds */}
          {secondsElapsed >= 20 && (
            <div className="max-w-md mx-auto pt-2 space-y-3">
              <p className="text-xs text-amber-300 font-bold flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>O ranking está demorando mais que o normal.</span>
              </p>
              <button
                onClick={() => fetchRanking(selectedMetric)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}

        </div>
      ) : error ? (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 text-center space-y-3">
          <p className="text-xs sm:text-sm text-amber-400 font-bold flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Não foi possível carregar o ranking de marcas no momento.</span>
          </p>
          <button
            onClick={() => fetchRanking(selectedMetric)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : top4.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
          {top4.map((item) => {
            const badge = getRankBadge(item.rank);
            return (
              <div
                key={item.brand}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between space-y-2.5 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-md border ${badge.bg}`}>
                    {badge.text}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {item.contentCount} {item.contentCount === 1 ? 'vídeo' : 'vídeos'}
                  </span>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-black text-white tracking-tight uppercase truncate">
                    {item.brand}
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-cyan-400 mt-0.5">
                    {item.displayValue}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 py-4 text-center">Nenhuma marca encontrada.</p>
      )}

      {/* Full Ranking Collapsible Option */}
      {!loading && !error && restRanking.length > 0 && (
        <div className="pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setShowFullRanking(!showFullRanking)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer py-1"
          >
            {showFullRanking ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Ocultar ranking completo</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Ver ranking completo ({restRanking.length} outras marcas)</span>
              </>
            )}
          </button>

          {showFullRanking && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {restRanking.map((item) => (
                <div
                  key={item.brand}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold w-6">{item.rank}º</span>
                    <span className="font-bold text-slate-200 uppercase">{item.brand}</span>
                  </div>
                  <span className="font-mono font-semibold text-cyan-400">{item.displayValue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
