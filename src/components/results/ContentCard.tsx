import React from 'react';
import { Youtube, Instagram, ExternalLink, Eye, ThumbsUp, MessageSquare, Share2, TrendingUp, Calendar, Tag } from 'lucide-react';
import { ContentItem } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

interface ContentCardProps {
  content: ContentItem;
  rankPosition?: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, rankPosition }) => {
  const formatNum = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mi';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace('.', ',').replace(',0', '') + ' mil';
    }
    return num.toLocaleString('pt-BR');
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  };

  const isYouTube = content.platform === 'youtube';
  const isInstagram = content.platform === 'instagram';

  // Rank Badge Helper
  const renderRankBadge = () => {
    if (!rankPosition) return null;
    if (rankPosition === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] shadow-lg border border-amber-300">
          🥇 1º LUGAR
        </span>
      );
    }
    if (rankPosition === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-300 text-slate-950 font-black text-[11px] shadow-lg border border-white">
          🥈 2º LUGAR
        </span>
      );
    }
    if (rankPosition === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700 text-amber-100 font-black text-[11px] shadow-lg border border-amber-500">
          🥉 3º LUGAR
        </span>
      );
    }
    if (rankPosition === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-black text-[11px] shadow-lg border border-cyan-500/50">
          4º LUGAR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/90 text-slate-400 font-extrabold text-[10px] border border-slate-800">
        #{rankPosition}
      </span>
    );
  };

  const cardBorderClass = rankPosition === 1
    ? 'border-2 border-amber-500/80 shadow-amber-500/10'
    : rankPosition === 2
    ? 'border-2 border-slate-300/60'
    : rankPosition === 3
    ? 'border-2 border-amber-700/60'
    : rankPosition === 4
    ? 'border border-cyan-500/40'
    : 'border border-slate-800 hover:border-slate-700/80';

  return (
    <div className={`bg-slate-900/90 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group ${cardBorderClass}`}>
      
      {/* Top Media / Thumbnail Section */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden">
        <ImageWithFallback
          src={content.thumbnailUrl}
          backupSrc="https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_600,h_600/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png"
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
          {/* Platform Badge */}
          {isYouTube && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/90 text-white font-black text-[11px] shadow-md uppercase tracking-wider backdrop-blur-md">
              <Youtube className="w-3.5 h-3.5" />
              YouTube
            </span>
          )}

          {isInstagram && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-[11px] shadow-md uppercase tracking-wider backdrop-blur-md">
              <Instagram className="w-3.5 h-3.5" />
              Instagram
            </span>
          )}

          {content.platform === 'tiktok' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black border border-cyan-500/50 text-cyan-400 font-black text-[11px] shadow-md uppercase tracking-wider backdrop-blur-md">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
              </svg>
              TikTok
            </span>
          )}

          {/* Content Type Badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-700/80 font-bold text-[10px] uppercase tracking-wider backdrop-blur-md">
            {content.contentType === 'shorts' ? 'Shorts' : content.contentType === 'reels' ? 'Reels' : 'Vídeo'}
          </span>
        </div>

        {/* Top Right Rank Badge & Score */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {renderRankBadge()}
          {content.performanceScore !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/90 text-cyan-300 font-mono font-black text-[10px] border border-cyan-500/30">
              Score: {content.performanceScore}
            </span>
          )}
        </div>

        {/* Date Badge */}
        <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-cyan-400" />
          {formatDate(content.publishedAt)}
        </div>
      </div>

      {/* Body Content Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
        
        <div className="space-y-2">
          {/* Brand Tags */}
          {content.brands && content.brands.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {content.brands.map((bName, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-extrabold uppercase">
                  <Tag className="w-2.5 h-2.5 text-cyan-400" />
                  {bName}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h4 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
            {content.title}
          </h4>
        </div>

        {/* Metrics Grid: 2 Rows */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
          {/* Linha 1: Visualizações | Curtidas | Comentários */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            
            {/* Visualizações */}
            <div 
              title="Visualizações" 
              className="bg-slate-950/60 py-2 px-1.5 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 min-w-0 transition-colors hover:border-amber-500/40 hover:bg-slate-900/80 cursor-default"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-black text-amber-400 whitespace-nowrap">
                {formatNum(content.metrics.viewsCount)}
              </span>
            </div>

            {/* Curtidas */}
            <div 
              title="Curtidas" 
              className="bg-slate-950/60 py-2 px-1.5 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 min-w-0 transition-colors hover:border-rose-500/40 hover:bg-slate-900/80 cursor-default"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-xs font-black text-rose-400 whitespace-nowrap">
                {formatNum(content.metrics.likesCount)}
              </span>
            </div>

            {/* Comentários */}
            <div 
              title="Comentários" 
              className="bg-slate-950/60 py-2 px-1.5 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 min-w-0 transition-colors hover:border-sky-500/40 hover:bg-slate-900/80 cursor-default"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-xs font-black text-sky-400 whitespace-nowrap">
                {formatNum(content.metrics.commentsCount)}
              </span>
            </div>

          </div>

          {/* Linha 2: Compartilhamentos | Engajamento */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center">

            {/* Compartilhamentos */}
            <div 
              title="Compartilhamentos" 
              className="bg-slate-950/60 py-2 px-1.5 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 min-w-0 transition-colors hover:border-emerald-500/40 hover:bg-slate-900/80 cursor-default"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className={`text-xs font-black whitespace-nowrap ${content.metrics.sharesCount !== null ? 'text-emerald-400' : 'text-slate-500'}`}>
                {content.metrics.sharesCount !== null ? formatNum(content.metrics.sharesCount) : '—'}
              </span>
            </div>

            {/* Engajamento */}
            <div 
              title="Engajamento" 
              className="bg-slate-950/60 py-2 px-1.5 rounded-lg border border-slate-800/80 flex items-center justify-center gap-1.5 min-w-0 transition-colors hover:border-purple-500/40 hover:bg-slate-900/80 cursor-default"
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-xs font-black text-purple-400 whitespace-nowrap">
                {content.metrics.engagementRate !== null ? `${content.metrics.engagementRate.toString().replace('.', ',')}%` : '—'}
              </span>
            </div>

          </div>
        </div>

        {/* Action Link Button */}
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition-all duration-200 border cursor-pointer active:scale-95 ${
            isYouTube
              ? 'bg-red-600/90 hover:bg-red-600 border-red-500/40 hover:shadow-lg hover:shadow-red-600/20'
              : content.platform === 'tiktok'
              ? 'bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 border-cyan-500/50 text-cyan-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20'
              : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 border-pink-500/40 hover:shadow-lg hover:shadow-pink-600/20'
          }`}
        >
          <span>
            {isYouTube ? 'VER NO YOUTUBE' : content.platform === 'tiktok' ? 'VER NO TIKTOK' : 'VER NO INSTAGRAM'}
          </span>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
        </a>

      </div>

    </div>
  );
};
