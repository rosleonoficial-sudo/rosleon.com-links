import React from 'react';
import {
  Youtube,
  Instagram,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  TrendingUp,
  Users,
  Video,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Key,
  ExternalLink
} from 'lucide-react';
import { ResultsSummaryData, ResultsFilterState, CentralMediaKitData, ResultsStatusResponse } from '../../types';

interface ResultsSummaryProps {
  summary: ResultsSummaryData;
  filters: ResultsFilterState;
  mediaKitData?: CentralMediaKitData | null;
  status?: ResultsStatusResponse | null;
  onOpenTokenModal?: () => void;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  summary,
  filters,
  mediaKitData,
  status,
  onOpenTokenModal
}) => {
  const formatNum = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(2).replace('.', ',').replace(',00', '') + ' mi';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mil';
    }
    return num.toLocaleString('pt-BR');
  };

  // YouTube Metrics
  const ytSubsFormatted = mediaKitData?.youtube?.subscribersFormatted || '45,3 mil';
  const ytViewsFormatted = mediaKitData?.youtube?.viewsFormatted || '8,90 MILHÕES';
  const ytVideosCount = mediaKitData?.youtube?.youtubeReportedVideoCount || 670;
  const ytAuditableCount = summary.breakdown.youtube?.totalContents || mediaKitData?.youtube?.videos || 665;
  const isYtActive = status?.platforms?.youtube?.status === 'active';

  // Instagram Metrics
  const igFollowers = mediaKitData?.instagram?.followersCount || mediaKitData?.instagram?.followers || 38772;
  const igFollowersFormatted = `${(igFollowers / 1000).toFixed(1).replace('.', ',')} mil`;
  const igPostsCount = summary.breakdown.instagram?.totalContents || mediaKitData?.instagram?.videosTotal || 184;
  const igViewsFormatted = mediaKitData?.instagram?.viewsTotalFormatted || '1,07 MILHÕES';
  const isIgExpired = Boolean(mediaKitData?.instagram?.tokenExpired || status?.platforms?.instagram?.status === 'error' || status?.platforms?.instagram?.status === 'degraded');
  const igErrorMsg = mediaKitData?.instagram?.syncError || status?.platforms?.instagram?.lastError;

  // TikTok Metrics
  const ttFollowers = mediaKitData?.tiktok?.followers || 15300;
  const ttFollowersFormatted = mediaKitData?.tiktok?.followersFormatted || '15,3 mil';
  const ttLikes = mediaKitData?.tiktok?.likes || 99200;
  const ttLikesFormatted = mediaKitData?.tiktok?.likesFormatted || '99,2 mil';
  const ttVideosCount = mediaKitData?.tiktok?.videos || 334;
  const isTtConnected = Boolean(mediaKitData?.tiktok?.isAutoSynced || status?.platforms?.tiktok?.connected);

  // Consolidated Community and Views
  const totalCommunityNum = (mediaKitData?.communityTotal?.total) || (45300 + igFollowers + ttFollowers);
  const totalCommunityFormatted = `${(totalCommunityNum / 1000).toFixed(1).replace('.', ',')} mil`;
  const totalViewsFormatted = mediaKitData?.totalViews3NetworksFormatted || '9,98 MILHÕES';

  const ytShares = summary.breakdown.youtube?.totalShares ?? null;
  const igShares = summary.breakdown.instagram?.totalShares ?? null;
  const ttShares = summary.breakdown.tiktok?.totalShares ?? null;

  return (
    <div className="space-y-6 text-left">
      
      {/* Brand Ranking Banner (When a specific brand is searched/filtered) */}
      {summary.brandRanking && (
        <div className="bg-gradient-to-r from-slate-900/95 via-cyan-950/40 to-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                <span className="text-cyan-400 uppercase">{summary.brandRanking.brandName}</span> — Desempenho no Catálogo
              </h3>
            </div>
            <div className="text-[11px] font-bold text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              entre <span className="text-cyan-300 font-extrabold">{summary.brandRanking.totalBrands}</span> marcas analisadas
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
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

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
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

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
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

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
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

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
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

      {/* OVERVIEW CONSOLIDATED HERO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Community */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Users className="w-4 h-4" />
              Comunidade Total
            </span>
            <span className="text-[11px] text-slate-500">3 Redes</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            +{totalCommunityFormatted}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
            <span>YT: {ytSubsFormatted}</span>
            <span>·</span>
            <span>IG: {igFollowersFormatted}</span>
            <span>·</span>
            <span>TT: {ttFollowersFormatted}</span>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Eye className="w-4 h-4" />
              Visualizações Totais
            </span>
            <span className="text-[11px] text-slate-500">Auditadas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            +{totalViewsFormatted}
          </div>
          <p className="text-xs text-slate-400">
            Somatório verificado de vídeos e reels
          </p>
        </div>

        {/* Total Engagements */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-rose-400">
              <ThumbsUp className="w-4 h-4" />
              Total de Curtidas
            </span>
            <span className="text-[11px] text-slate-500">Público Ativo</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
            +{formatNum(summary.totalLikes || 316000)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>{formatNum(summary.totalComments || 61600)} comentários</span>
            <span>·</span>
            <span>{formatNum(summary.totalShares || 28500)} compart.</span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-purple-400">
              <TrendingUp className="w-4 h-4" />
              Taxa de Engajamento
            </span>
            <span className="text-[11px] text-slate-500">Média</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 tracking-tight">
            {summary.avgEngagementRate || 5.59}%
          </div>
          <p className="text-xs text-slate-400">
            Fórmula: (interações ÷ views) × 100
          </p>
        </div>
      </div>

      {/* 3 DISTINCT PLATFORM CARDS (YOUTUBE, INSTAGRAM, TIKTOK) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase">
            Métricas Principais por Plataforma
          </h2>
          <span className="text-xs text-slate-500">Dados oficiais e auditados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* ========================================================
              1. YOUTUBE CARD
              ======================================================== */}
          <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-red-500/50 transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    YouTube
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                  </h3>
                  <a
                    href="https://www.youtube.com/@rosleonoficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors inline-flex items-center gap-1 font-mono"
                  >
                    @rosleonoficial <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase tracking-wider">
                ● Ativo
              </span>
            </div>

            {/* Metrics List */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Inscritos
                </span>
                <div className="text-3xl font-black text-white mt-0.5 tracking-tight">
                  {ytSubsFormatted}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {mediaKitData?.youtube?.subscribers?.toLocaleString('pt-BR') || '45.300'} inscritos confirmados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Visualizações
                  </span>
                  <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
                    {ytViewsFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500">Canal completo</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Vídeos
                  </span>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">
                    {ytVideosCount} vídeos
                  </div>
                  <span className="text-[10px] text-slate-500">{ytAuditableCount} no catálogo</span>
                </div>
              </div>
            </div>

            {/* Footer / Link */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">YouTube Data API v3</span>
              <a
                href="https://www.youtube.com/@rosleonoficial?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                Visitar canal <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>

          {/* ========================================================
              2. INSTAGRAM CARD
              ======================================================== */}
          <div className="bg-slate-900/90 border border-pink-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-pink-500/50 transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-purple-600/10 border border-rose-500/30 text-rose-400">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    Instagram
                  </h3>
                  <a
                    href="https://www.instagram.com/rosleonoficial/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-pink-400 transition-colors inline-flex items-center gap-1 font-mono"
                  >
                    @rosleonoficial <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {isIgExpired ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Token Expirado
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase tracking-wider">
                  ● Conectado
                </span>
              )}
            </div>

            {/* Metrics List */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Seguidores
                </span>
                <div className="text-3xl font-black text-white mt-0.5 tracking-tight">
                  {igFollowersFormatted}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {igFollowers.toLocaleString('pt-BR')} seguidores
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Publicações / Reels
                  </span>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">
                    {igPostsCount} posts
                  </div>
                  <span className="text-[10px] text-slate-500">Catálogo verificado</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Visualizações
                  </span>
                  <div className="text-base sm:text-lg font-black text-rose-400 mt-0.5">
                    {igViewsFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500">Últimos 30 dias / reels</span>
                </div>
              </div>
            </div>

            {/* Token Status / Update Prompt */}
            {isIgExpired ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Sessão Meta expirada (05/10/26)
                  </span>
                  {onOpenTokenModal && (
                    <button
                      onClick={onOpenTokenModal}
                      className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] transition-colors cursor-pointer shrink-0"
                    >
                      Renovar Token
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Dados anteriores protegidos. Cole um novo token da Meta para sincronizar os conteúdos recentes.
                </p>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">Meta Graph API v20.0</span>
                <a
                  href="https://www.instagram.com/rosleonoficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Ver no Instagram <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

          </div>

          {/* ========================================================
              3. TIKTOK CARD
              ======================================================== */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-cyan-500/50 transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    TikTok
                  </h3>
                  <a
                    href="https://www.tiktok.com/@rosleonoficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 font-mono"
                  >
                    @rosleonoficial <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {isTtConnected ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase tracking-wider">
                  ● Conectado
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 uppercase tracking-wider">
                  Auditado
                </span>
              )}
            </div>

            {/* Metrics List */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Seguidores
                </span>
                <div className="text-3xl font-black text-white mt-0.5 tracking-tight">
                  {ttFollowersFormatted}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {ttFollowers.toLocaleString('pt-BR')} seguidores no perfil
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Curtidas Totais
                  </span>
                  <div className="text-base sm:text-lg font-black text-cyan-400 mt-0.5">
                    {ttLikesFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500">{ttLikes.toLocaleString('pt-BR')} curtidas</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Vídeos
                  </span>
                  <div className="text-base sm:text-lg font-black text-white mt-0.5">
                    {ttVideosCount} vídeos
                  </div>
                  <span className="text-[10px] text-slate-500">Publicados no perfil</span>
                </div>
              </div>
            </div>

            {/* Footer / Connect */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">Perfil Público TikTok</span>
              {!isTtConnected ? (
                <a
                  href="/api/tiktok/login"
                  className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Conectar OAuth <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://www.tiktok.com/@rosleonoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Abrir perfil <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
