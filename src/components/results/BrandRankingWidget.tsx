import React, { useState, useEffect } from 'react';
import { Trophy, Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

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

export const BrandRankingWidget: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<BrandMetricOption>('views');
  const [rankingData, setRankingData] = useState<BrandRankingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFullRanking, setShowFullRanking] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/brands/ranking?metric=${selectedMetric}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.ranking)) {
          setRankingData(data.ranking);
        }
      })
      .catch(err => console.warn('Erro ao carregar ranking de marcas:', err))
      .finally(() => setLoading(false));
  }, [selectedMetric]);

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

      {/* Top 4 Compact Grid */}
      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Calculando ranking de marcas...</span>
        </div>
      ) : top4.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
      {!loading && restRanking.length > 0 && (
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
