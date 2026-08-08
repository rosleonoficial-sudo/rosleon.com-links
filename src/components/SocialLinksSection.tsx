import React from 'react';
import { SocialLink, InstagramStats } from '../types';
import { Instagram, ChevronRight, Users, Eye, TrendingUp, ArrowUpRight, Send, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SocialLinksSectionProps {
  instagram: SocialLink;
  tiktok: SocialLink;
  telegram?: SocialLink;
  instagramStats?: InstagramStats | null;
  instagramLoading?: boolean;
  instagramError?: string | null;
  instagramConfigured?: boolean;
  onTrackClick: (linkName: string) => void;
  showTitle?: boolean;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  instagram,
  tiktok,
  telegram,
  instagramStats,
  instagramLoading,
  instagramError,
  instagramConfigured,
  onTrackClick,
  showTitle = true
}) => {
  const { t, formatNumber } = useLanguage();

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-4">
      {/* Section Divider Title */}
      {showTitle && (
        <div className="flex items-center justify-center gap-4 my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent flex-1 max-w-xs" />
          <h3 className="text-xs sm:text-sm font-bold text-amber-400 tracking-widest uppercase">
            {t('sections.followMe')}
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent flex-1 max-w-xs" />
        </div>
      )}

      <div className="space-y-4">
        {/* Instagram Card - Native Profile Style */}
        {instagram?.enabled && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 hover:border-pink-500/40 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              
              {/* Profile Header: Avatar + Handle + Name */}
              <div className="flex items-center gap-4">
                {/* Story Ring Avatar */}
                <div className="relative shrink-0">
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md shadow-pink-500/20">
                    <img
                      src={instagramStats?.profilePictureUrl || "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png"}
                      alt="Perfil Instagram ROSLEON"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-900 object-cover bg-slate-800"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png";
                      }}
                    />
                  </div>
                  {/* Small Instagram Icon Badge on Avatar */}
                  <div className="absolute -bottom-1 -right-1 p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full text-white shadow border border-slate-900">
                    <Instagram className="w-3 h-3" />
                  </div>
                </div>

                {/* Username, Verified Badge & Name */}
                <div className="text-left space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1">
                      {instagramStats?.username || "rosleonoficial"}
                      {/* Instagram Verified Badge */}
                      <svg className="w-4 h-4 text-[#0095F6] fill-current inline-block shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-3.8-3.8 1.4-1.4 2.4 2.4 6.4-6.4 1.4 1.4-7.8 7.8z" />
                      </svg>
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-300">
                    {instagramStats?.name || "ROSLEON | Leonardo Mey"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(!instagram.subtitle || instagram.subtitle.includes('Conteúdo diário')) ? t('social.instagramSub') : instagram.subtitle}
                  </p>
                </div>
              </div>

              {/* Instagram Stats Row */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 py-2.5 px-4 sm:px-6 rounded-xl bg-slate-950/70 border border-slate-800 mx-auto">
                {/* Live sync dot */}
                <span className="relative flex h-2 w-2 shrink-0" title="Sincronizado via Instagram Graph API">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>

                {/* Followers */}
                <div className="text-center px-1">
                  <div className="text-sm sm:text-base font-extrabold text-white">
                    {instagramStats?.followersFormatted || formatNumber(38710)}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {t('social.followers')}
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-800" />

                {/* Visualizações / Alcance */}
                <div className="text-center px-1">
                  <div className="text-sm sm:text-base font-extrabold text-pink-400">
                    {instagramStats?.views30dFormatted || formatNumber(259333)}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {t('social.reach28d')}
                  </div>
                </div>

                {instagramStats?.reach30dFormatted && (
                  <>
                    <div className="h-7 w-px bg-slate-800" />
                    {/* Alcance */}
                    <div className="text-center px-1">
                      <div className="text-sm sm:text-base font-extrabold text-rose-400">
                        {instagramStats.reach30dFormatted}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                        {t('social.reach30d')}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Instagram Action Button com Animação Leve */}
              <div className="shrink-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/40 via-sky-400/50 to-indigo-500/40 rounded-xl blur-md animate-glow-pulse pointer-events-none" />

                <a
                  href={instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackClick('Instagram')}
                  className="relative inline-flex items-center justify-center gap-2.5 py-3 px-6 w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#0095F6] via-[#1877F2] to-[#0095F6] hover:from-[#1877F2] hover:to-[#0095F6] text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 active:scale-95 transition-all duration-300 border border-blue-300/40 animate-button-pulse hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none animate-shimmer-beam" />
                  <Instagram className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 duration-200 relative z-10" />
                  <span className="tracking-wide uppercase font-black relative z-10 text-white whitespace-nowrap">{instagram.buttonText || t('social.viewInstagram')}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 relative z-10" />
                </a>
              </div>

            </div>
          </div>
        )}


        {/* TikTok Card - Native Profile Style */}
        {tiktok?.enabled && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              
              {/* Profile Header: Avatar + Handle + Name */}
              <div className="flex items-center gap-4">
                {/* TikTok Gradient Ring Avatar */}
                <div className="relative shrink-0">
                  <div className="p-[3px] rounded-full bg-gradient-to-tr from-cyan-500 via-sky-400 to-rose-500 shadow-md shadow-cyan-500/20">
                    <img
                      src={instagramStats?.profilePictureUrl || "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png"}
                      alt="Perfil TikTok ROSLEON"
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-900 object-cover bg-slate-800"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png";
                      }}
                    />
                  </div>
                  {/* TikTok Icon Badge on Avatar */}
                  <div className="absolute -bottom-1 -right-1 p-1 bg-slate-950 rounded-full text-cyan-400 shadow border border-slate-800">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
                    </svg>
                  </div>
                </div>

                {/* Username, Verified Badge & Name */}
                <div className="text-left space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1">
                      @rosleonoficial
                      {/* TikTok Checkmark */}
                      <svg className="w-4 h-4 text-cyan-400 fill-current inline-block shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-3.8-3.8 1.4-1.4 2.4 2.4 6.4-6.4 1.4 1.4-7.8 7.8z" />
                      </svg>
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-300">
                    ROSLEON | Leonardo Mey
                  </p>
                  <p className="text-xs text-slate-400">
                    {(!tiktok.subtitle || tiktok.subtitle.includes('Conteúdo diário')) ? t('social.tiktokSub') : tiktok.subtitle}
                  </p>
                </div>
              </div>

              {/* TikTok Stats Row */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 py-2.5 px-4 sm:px-6 rounded-xl bg-slate-950/70 border border-slate-800 mx-auto">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>

                {/* Followers */}
                <div className="text-center px-1">
                  <div className="text-sm sm:text-base font-extrabold text-white">
                    {formatNumber(15089)}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {t('social.followers')}
                  </div>
                </div>

                <div className="h-7 w-px bg-slate-800" />

                {/* Visualizações */}
                <div className="text-center px-1">
                  <div className="text-sm sm:text-base font-extrabold text-cyan-400">
                    {formatNumber(2356235)}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                    {t('youtube.views')}
                  </div>
                </div>
              </div>

              {/* TikTok Action Button com Animação Leve */}
              <div className="shrink-0 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/40 via-sky-400/50 to-rose-500/40 rounded-xl blur-md animate-glow-pulse pointer-events-none" />

                <a
                  href={tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackClick('TikTok')}
                  className="relative inline-flex items-center justify-center gap-2.5 py-3 px-6 w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-md shadow-cyan-600/25 active:scale-95 transition-all duration-300 border border-cyan-300/40 animate-button-pulse hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none animate-shimmer-beam" />
                  <svg className="w-4.5 h-4.5 fill-current shrink-0 transition-transform group-hover:scale-110 duration-200 relative z-10" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.33 22a6.33 6.33 0 0 0 6.34-6.32V9.4a8.16 8.16 0 0 0 4.92 1.62V7.57a4.85 4.85 0 0 1-1-.88z"/>
                  </svg>
                  <span className="tracking-wide uppercase font-black relative z-10 text-white whitespace-nowrap">{tiktok.buttonText || t('social.goToTikTok')}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 relative z-10" />
                </a>
              </div>

            </div>
          </div>
        )}


      </div>
    </section>
  );
};

