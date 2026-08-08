import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const PhoneMockup: React.FC = () => {
  const { t } = useLanguage();
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div className="relative flex items-center justify-center py-4 lg:py-0 select-none">
      {/* Background Glow Pedestal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="w-48 h-48 sm:w-64 sm:h-64 bg-blue-600/30 rounded-full blur-2xl" />
        
        {/* Glowing Pedestal Disk */}
        <div className="absolute bottom-0 w-64 sm:w-80 h-16 sm:h-20 border-2 border-cyan-400/40 rounded-[100%] bg-gradient-to-t from-cyan-500/20 to-transparent shadow-[0_0_30px_rgba(6,182,212,0.4)] transform rotate-x-60" />
      </div>

      {/* Phone Container Body */}
      <div className="relative z-10 w-[270px] sm:w-[300px] bg-slate-950 border-[7px] border-slate-800 rounded-[42px] shadow-2xl shadow-cyan-950/90 overflow-hidden ring-1 ring-cyan-500/40">
        
        {/* Phone Top Speaker & Dynamic Island Notch */}
        <div className="bg-slate-950 px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-900 z-20 relative">
          <span className="text-[10px] font-semibold text-slate-300 tracking-wider">9:41</span>
          <div className="w-16 h-3.5 bg-black rounded-full flex items-center justify-center gap-1 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/80 animate-ping" />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <div className="w-2.5 h-2 bg-slate-400 rounded-xs" />
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
          {isStarted ? (
            <iframe
              src="https://www.youtube.com/embed/OmoZTIh7DCs?autoplay=1&mute=1&loop=1&playlist=OmoZTIh7DCs&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3"
              title="ROSLEON YouTube Short"
              className="w-full h-full scale-[1.35] object-cover border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
            />
          ) : (
            /* Fallback Capa/Poster + Play Button Overlay */
            <div 
              onClick={() => setIsStarted(true)}
              className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer group transition-all"
            >
              <img 
                src="https://i.postimg.cc/XJ9vMSjR/Chat-GPT-Image-16-de-jul-de-2026-16-19-14.png"
                alt="Capa Vídeo ROSLEON"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-85 transition-opacity"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={300}
                height={533}
              />
              <div className="relative z-10 p-4 rounded-full bg-red-600 group-hover:bg-red-500 text-white shadow-2xl shadow-red-600/60 group-hover:scale-110 transition-transform duration-300 border-2 border-white/80">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <span className="relative z-10 mt-3 text-xs font-bold text-white bg-black/80 px-3 py-1 rounded-full border border-white/20">
                {t('hero.tapToWatchVideo')}
              </span>
            </div>
          )}

          {/* Transparent Overlay to start video when tapped */}
          {!isStarted && (
            <div 
              className="absolute inset-0 z-20 bg-transparent cursor-pointer" 
              onClick={() => setIsStarted(true)}
            />
          )}
        </div>

        {/* Home Bar Indicator */}
        <div className="bg-slate-950 py-2 flex justify-center border-t border-slate-900 z-20 relative">
          <div className="w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};


