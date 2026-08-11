import React, { useState } from 'react';
import { Youtube, Play, ExternalLink, X } from 'lucide-react';
import { CreatorStats } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from './ImageWithFallback';

interface YouTubeSectionProps {
  youtubeData: {
    title: string;
    description: string;
    buttonText: string;
    url: string;
    bannerText: string;
    bannerImage: string;
  };
  stats?: CreatorStats;
  onTrackClick: (linkName: string) => void;
}

export const YouTubeSection: React.FC<YouTubeSectionProps> = ({ youtubeData, stats, onTrackClick }) => {
  const { t } = useLanguage();
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <section id="youtube" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto my-4">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 hover:border-red-500/40 rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Profile Header: Avatar + Channel Info */}
          <div className="flex items-center gap-4">
            {/* Story/Channel Ring Avatar with Play Button trigger */}
            <div 
              onClick={() => {
                setShowVideoModal(true);
                onTrackClick('YouTube Play');
              }}
              className="relative shrink-0 cursor-pointer group"
              title={t('youtube.clickToWatch')}
            >
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
                <ImageWithFallback
                  src="https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png"
                  backupSrc="https://res.cloudinary.com/jfqsykts/image/upload/c_fill,w_160,h_160,g_auto/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png"
                  alt="Perfil YouTube ROSLEON"
                  initials="YT"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-900 object-cover bg-slate-800"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  width={64}
                  height={64}
                />
              </div>
              {/* Play / Youtube Icon Badge */}
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-red-600 group-hover:bg-red-500 rounded-full text-white shadow border border-slate-900 transition-colors">
                <Play className="w-3 h-3 fill-current ml-0.5" />
              </div>
            </div>

            {/* Title, Handle & Description */}
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  {youtubeData.title || "ROSLEON"}
                  {/* YouTube Badge / Icon */}
                  <span className="p-0.5 bg-red-600 rounded text-white inline-flex items-center justify-center">
                    <Youtube className="w-3.5 h-3.5 fill-current" />
                  </span>
                </h4>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                @rosleonoficial
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                {(!youtubeData.description || youtubeData.description.includes('Reviews sinceros')) ? t('youtube.description') : youtubeData.description}
              </p>
            </div>
          </div>

          {/* YouTube Stats Row */}
          {stats && (
            <div className="flex items-center justify-center gap-3 sm:gap-6 py-2.5 px-4 sm:px-6 rounded-xl bg-slate-950/70 border border-slate-800 mx-auto">
              {/* Live indicator dot */}
              <span className="relative flex h-2 w-2 shrink-0" title="Dados ao vivo via YouTube Data API">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>

              {/* Inscritos */}
              <div className="text-center px-1">
                <div className="text-sm sm:text-base font-extrabold text-white">
                  {stats.subscribers}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                  {t('youtube.subscribers')}
                </div>
              </div>

              <div className="h-7 w-px bg-slate-800" />

              {/* Visualizações */}
              <div className="text-center px-1">
                <div className="text-sm sm:text-base font-extrabold text-red-400">
                  {stats.views}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                  {t('youtube.views')}
                </div>
                <div className="text-[8.5px] font-mono text-slate-400/90 mt-0.5">
                  Total acumulado
                </div>
              </div>

              {stats.videos && (
                <>
                  <div className="h-7 w-px bg-slate-800" />
                  {/* Vídeos */}
                  <div className="text-center px-1">
                    <div className="text-sm sm:text-base font-extrabold text-amber-400">
                      {stats.videos}
                    </div>
                    <div className="text-[10px] sm:text-xs font-medium text-slate-400">
                      {t('youtube.videos')}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Button Com Animação Leve e Suave */}
          <div className="shrink-0 relative group">
            {/* Halo de Luz Vermelho Suave ao Fundo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600/40 via-rose-500/50 to-red-600/40 rounded-xl blur-md animate-glow-pulse pointer-events-none" />

            <a
              href={youtubeData.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackClick('YouTube Channel')}
              className="relative inline-flex items-center justify-center gap-2.5 py-3 px-6 w-full sm:w-auto rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/25 active:scale-95 transition-all duration-300 border border-red-400/40 animate-button-pulse hover:scale-[1.02] overflow-hidden"
            >
              {/* Feixe de Luz Deslizante Suave */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none animate-shimmer-beam" />

              <Youtube className="w-5 h-5 fill-current shrink-0 text-white relative z-10 transition-transform group-hover:scale-110 duration-200" />
              <span className="tracking-wide uppercase font-black relative z-10 text-white whitespace-nowrap">{youtubeData.buttonText || t('youtube.subscribeButton')}</span>
              <ExternalLink className="w-4 h-4 relative z-10 text-white shrink-0 transition-transform group-hover:translate-x-0.5 duration-200" />
            </a>
          </div>

        </div>
      </div>

      {/* Video Modal Preview */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl p-4">
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" /> {t('youtube.officialChannel')}
              </h3>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <iframe
                src="https://www.youtube.com/embed/n2YMOWfvqWs?autoplay=1&rel=0"
                title="ROSLEON YouTube Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

