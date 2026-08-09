import React from 'react';
import { CreatorProfile, CreatorStats, InstagramStats } from '../types';
import { Handshake, Youtube, Instagram, CheckCircle2, Users, Sparkles, Mail, MessageSquare, Heart, Share2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from './ImageWithFallback';

interface PartnershipsCardProps {
  creator: CreatorProfile;
  stats: CreatorStats;
  instagramStats?: InstagramStats | null;
}

export const PartnershipsCard: React.FC<PartnershipsCardProps> = ({ creator, stats, instagramStats }) => {
  const { t, formatNumber } = useLanguage();

  // Calculate total combined views across YouTube, Instagram & TikTok
  const ytViewsRaw = stats.rawViews || 8298312;
  const igViewsRaw = instagramStats?.views30d || 259333;
  const ttViewsRaw = 2356235; // 2.356.235 TikTok views
  const totalViewsRaw = ytViewsRaw + igViewsRaw + ttViewsRaw;

  const totalViewsCompact = `+${formatNumber(Number((totalViewsRaw / 1_000_000).toFixed(1)))} ${t('partnerships.millions')}`;
  const totalViewsExact = formatNumber(totalViewsRaw);

  // Calculate total audience
  const ytSubsRaw = stats.rawSubscribers || 42600;
  const igFollowersRaw = instagramStats?.followersCount || 38710;
  const ttFollowersRaw = 15089; // 15.089 TikTok followers
  const totalAudienceRaw = ytSubsRaw + igFollowersRaw + ttFollowersRaw;
  const totalAudienceFormatted = `+${formatNumber(Number((totalAudienceRaw / 1_000).toFixed(1)))} ${t('partnerships.thousand')}`;

  return (
    <section id="parcerias" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-6">
      <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/20 hover:border-amber-500/50 transition-all duration-300">
        
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Parcerias Info & Creator Name */}
          <div className="md:col-span-4 space-y-2 text-left">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-bold tracking-wider uppercase">
              <Handshake className="w-4 h-4" />
              <span>{t('partnerships.tag')}</span>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {creator.name}
              </h3>
              <p className="text-amber-400/90 text-sm sm:text-base font-medium">
                {(!creator.title || creator.title.includes('Criador de conteúdo') || creator.title.includes('especialista em marketing')) ? t('partnerships.creatorTitle') : creator.title}
              </p>

              {/* Mercado Livre Professional Affiliate Badge */}
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-yellow-950/70 via-slate-900 to-amber-950/70 border border-yellow-500/40 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-400 text-slate-950 font-black shrink-0 shadow-sm shadow-yellow-500/30 flex items-center justify-center">
                    <svg className="w-5 h-5 fill-slate-950" viewBox="0 0 24 24">
                      {/* Mercado Livre Shopping / Handshake Icon */}
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
                        {t('partnerships.affiliateBadge')}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-300 text-slate-950 uppercase tracking-wider shadow-sm border border-white/60">
                        {t('partnerships.silverLevel')}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                      <span>Mercado Livre</span>
                      <span className="text-amber-400 font-extrabold">{t('partnerships.official')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>contato@rosleon.com</span>
              </div>
            </div>
          </div>

          {/* Center Column: Round Profile Photo with Gold Verified Badge */}
          <div className="md:col-span-4 flex justify-center py-2">
            <div className="relative group">
              {/* Soft Outer Golden Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-amber-400/50 via-amber-300/40 to-amber-500/50 rounded-full blur-xs opacity-60 group-hover:opacity-90 transition duration-300" />
              
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                <ImageWithFallback
                  src={creator.photoUrl || "https://i.postimg.cc/VLyPkxjv/Chat-GPT-Image-7-de-ago-de-2026-07-59-44.png"}
                  backupSrc="https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png"
                  alt={creator.name || "Leonardo Mey"}
                  initials="LM"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Verified Badge */}
              <div className="absolute bottom-1 right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-slate-900" title={t('partnerships.verifiedCreator')}>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Right Column: Combined Views & Stats */}
          <div className="md:col-span-4 space-y-4 text-left">
            
            {/* 1. SOMA TOTAL DE VISUALIZAÇÕES */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-amber-500/40 shadow-lg relative overflow-hidden space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-black tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>{t('partnerships.totalViews')}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-medium text-[10px]">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{t('partnerships.live')}</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight leading-none">
                  {totalViewsCompact}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({totalViewsExact})
                </span>
              </div>

              {/* Platform breakdown items with exact numbers */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800/80 text-center">
                <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-red-400 font-bold">
                    <Youtube className="w-3 h-3 fill-current" /> YouTube
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {formatNumber(Number((ytViewsRaw / 1_000_000).toFixed(1)))} {t('partnerships.million')}
                  </div>
                </div>

                <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-pink-400 font-bold">
                    <Instagram className="w-3 h-3" /> Instagram
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {formatNumber(Math.round(igViewsRaw / 1_000))} {t('partnerships.thousand')}
                  </div>
                </div>

                <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 font-bold">
                    <svg className="w-3 h-3 fill-current inline-block" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
                    </svg> TikTok
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5">
                    {formatNumber(Number((ttViewsRaw / 1_000_000).toFixed(1)))} {t('partnerships.million')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Engajamento Total Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('partnerships.totalEngagement')}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">{t('partnerships.engagementSub')}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                {/* Comentários */}
                <div 
                  title={t('partnerships.comments')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/30 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] sm:text-xs lg:text-sm font-black text-white leading-tight truncate w-full">
                    +185 {t('partnerships.thousand')}
                  </div>
                </div>

                {/* Curtidas */}
                <div 
                  title={t('partnerships.likes')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-rose-500/30 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400 mb-1">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <div className="text-[11px] sm:text-xs lg:text-sm font-black text-white leading-tight truncate w-full">
                    +1,2 {t('partnerships.million')}
                  </div>
                </div>

                {/* Compartilhamentos */}
                <div 
                  title={t('partnerships.shares')}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/30 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 mb-1">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] sm:text-xs lg:text-sm font-black text-white leading-tight truncate w-full">
                    +340 {t('partnerships.thousand')}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Comunidade Total Acumulada */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-sm space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white leading-none">
                    {totalAudienceFormatted}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {t('partnerships.communityTotal')}
                  </div>
                </div>
              </div>

              {/* Detalhamento de inscritos/seguidores de cada rede */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-center">
                <div className="bg-slate-900/90 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-red-400 font-bold">
                    <Youtube className="w-3 h-3 fill-current" /> YouTube
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {formatNumber(ytSubsRaw)}
                  </div>
                </div>

                <div className="bg-slate-900/90 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-pink-400 font-bold">
                    <Instagram className="w-3 h-3" /> Instagram
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {formatNumber(igFollowersRaw)}
                  </div>
                </div>

                <div className="bg-slate-900/90 py-1.5 px-1 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 font-bold">
                    <svg className="w-3 h-3 fill-current inline-block" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
                    </svg> TikTok
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {formatNumber(ttFollowersRaw)}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Botão de Contato Comercial */}
            <div className="pt-2 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/40 via-amber-300/60 to-amber-400/40 rounded-2xl blur-md animate-glow-pulse pointer-events-none" />

              <a
                href="mailto:contato@rosleon.com"
                className="relative flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:via-amber-200 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all duration-300 w-full border border-amber-200/90 animate-button-pulse hover:scale-[1.02] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none animate-shimmer-beam" />

                <Mail className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 text-slate-950 relative z-10 transition-transform group-hover:scale-110 duration-200" />
                <span className="tracking-wider uppercase font-black text-slate-950 relative z-10 text-xs sm:text-sm whitespace-nowrap">
                  {t('partnerships.contactButton')}
                </span>
                <Sparkles className="w-4 h-4 shrink-0 text-slate-950 relative z-10 opacity-80" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

