import React from 'react';
import { Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, Video, Youtube, Instagram, Trophy } from 'lucide-react';
import { ResultsSummaryData, ResultsFilterState } from '../../types';

interface ResultsSummaryProps {
  summary: ResultsSummaryData;
  filters: ResultsFilterState;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ summary, filters }) => {
  const formatNum = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mi';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mil';
    }
    return num.toLocaleString('pt-BR');
  };

  const ytShares = summary.breakdown.youtube?.totalShares ?? null;
  const igShares = summary.breakdown.instagram?.totalShares ?? null;
  const ttShares = summary.breakdown.tiktok?.totalShares ?? null;

  let sharesMainValue = '—';
  let sharesSubtext = 'Não disponível';

  if (filters.platform === 'youtube') {
    if (ytShares !== null) {
      sharesMainValue = formatNum(ytShares);
      sharesSubtext = `${ytShares.toLocaleString('pt-BR')} compartilhamentos no YouTube`;
    } else {
      sharesMainValue = '—';
      sharesSubtext = 'Não disponível na API do YouTube';
    }
  } else if (filters.platform === 'instagram') {
    if (igShares !== null) {
      sharesMainValue = formatNum(igShares);
      sharesSubtext = `${igShares.toLocaleString('pt-BR')} compartilhamentos no Instagram`;
    } else {
      sharesMainValue = '—';
      sharesSubtext = 'Não disponível no Instagram';
    }
  } else if (filters.platform === 'tiktok') {
    if (ttShares !== null) {
      sharesMainValue = formatNum(ttShares);
      sharesSubtext = `${ttShares.toLocaleString('pt-BR')} compartilhamentos no TikTok`;
    } else {
      sharesMainValue = '—';
      sharesSubtext = 'Não disponível no TikTok';
    }
  } else {
    if (summary.totalShares !== null) {
      sharesMainValue = formatNum(summary.totalShares);
    } else {
      sharesMainValue = '—';
    }

    const ytStr = ytShares !== null ? ytShares.toLocaleString('pt-BR') : '—';
    const igStr = igShares !== null ? igShares.toLocaleString('pt-BR') : '—';
    const ttStr = ttShares !== null ? ttShares.toLocaleString('pt-BR') : '—';
    sharesSubtext = `YT: ${ytStr} • IG: ${igStr} • TT: ${ttStr}`;
  }

  return (
    <div className="space-y-4 text-left">
      
      {/* Brand Ranking Banner (Small, elegant ranking summary for detected brand) */}
      {summary.brandRanking && (
        <div className="bg-gradient-to-r from-slate-900/95 via-cyan-950/40 to-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                <span className="text-cyan-400 uppercase">{summary.brandRanking.brandName}</span> — Ranking da Marca
              </h3>
            </div>
            <div className="text-[11px] font-bold text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              entre <span className="text-cyan-300 font-extrabold">{summary.brandRanking.totalBrands}</span> marcas analisadas
            </div>
          </div>

          {/* Ranking Metrics List / Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            
            {/* 1. Visualizações (Highlighted as Primary) */}
            <div className="col-span-2 sm:col-span-1 bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 flex items-center gap-2.5 shadow-md">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-black text-amber-300 truncate">
                  #{summary.brandRanking.ranks.views.rank}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 truncate">
                  Visualizações
                </div>
              </div>
            </div>

            {/* 2. Curtidas */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 transition-colors hover:border-rose-500/30">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <ThumbsUp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-rose-400 truncate">
                  #{summary.brandRanking.ranks.likes.rank}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">
                  Curtidas
                </div>
              </div>
            </div>

            {/* 3. Comentários */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 transition-colors hover:border-sky-500/30">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-sky-400 truncate">
                  #{summary.brandRanking.ranks.comments.rank}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">
                  Comentários
                </div>
              </div>
            </div>

            {/* 4. Compartilhamentos */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 transition-colors hover:border-emerald-500/30">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-emerald-400 truncate">
                  #{summary.brandRanking.ranks.shares.rank}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">
                  Compart.
                </div>
              </div>
            </div>

            {/* 5. Engajamento */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 transition-colors hover:border-purple-500/30">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-purple-400 truncate">
                  #{summary.brandRanking.ranks.engagement.rank}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">
                  Engajamento
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Consolidated Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Contents */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>Conteúdos</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {summary.totalContents.toLocaleString('pt-BR')}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Publicações encontradas</p>
        </div>

        {/* Total Views */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Visualizações</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {formatNum(summary.totalViews)}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{summary.totalViews.toLocaleString('pt-BR')} totais</p>
        </div>

        {/* Total Likes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <ThumbsUp className="w-3.5 h-3.5 text-rose-400" />
            <span>Curtidas</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400">
            {formatNum(summary.totalLikes)}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{summary.totalLikes.toLocaleString('pt-BR')} totais</p>
        </div>

        {/* Total Comments */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>Comentários</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-400">
            {formatNum(summary.totalComments)}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{summary.totalComments.toLocaleString('pt-BR')} totais</p>
        </div>

        {/* Shares */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compartilhamentos</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {sharesMainValue}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {sharesSubtext}
          </p>
        </div>

        {/* Engagement Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Engajamento</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-400">
            {summary.avgEngagementRate}%
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Taxa média ponderada</p>
        </div>

      </div>

      {/* Network Breakdown Pill (When All Networks selected) */}
      {filters.platform === 'all' && (summary.breakdown.youtube || summary.breakdown.instagram) && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300">
          <span className="font-bold text-slate-400 uppercase text-[11px]">Distribuição:</span>

          {summary.breakdown.youtube && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Youtube className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-white">YouTube:</span>
              <span className="text-slate-300">{summary.breakdown.youtube.totalContents} conteúdos</span>
              <span className="text-amber-400 font-extrabold">({formatNum(summary.breakdown.youtube.totalViews)} views)</span>
            </div>
          )}

          {summary.breakdown.instagram && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Instagram className="w-4 h-4 text-pink-500" />
              <span className="font-semibold text-white">Instagram:</span>
              <span className="text-slate-300">{summary.breakdown.instagram.totalContents} conteúdos</span>
              <span className="text-pink-400 font-extrabold">({formatNum(summary.breakdown.instagram.totalViews)} views)</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
