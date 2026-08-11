import React, { useState, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, MoveHorizontal, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { ImageWithFallback } from './ImageWithFallback';

export const PhoneMockup: React.FC = () => {
  const { t } = useLanguage();
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(true);

  // Touch and drag swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchStartX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    touchEndX.current = clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 30;

    if (distance > minSwipeDistance) {
      // Swiped left -> next slide (Photo)
      setActiveSlide(1);
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev slide (Video)
      setActiveSlide(0);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-4 lg:py-0 select-none">
      {/* Background Glow Pedestal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="w-48 h-48 sm:w-64 sm:h-64 bg-blue-600/30 rounded-full blur-2xl" />
        
        {/* Glowing Pedestal Disk */}
        <div className="absolute bottom-6 w-64 sm:w-80 h-16 sm:h-20 border-2 border-cyan-400/40 rounded-[100%] bg-gradient-to-t from-cyan-500/20 to-transparent shadow-[0_0_30px_rgba(6,182,212,0.4)] transform rotate-x-60" />
      </div>

      {/* Phone Container Body */}
      <div className="relative z-10 w-[270px] sm:w-[300px] bg-slate-950 border-[7px] border-slate-800 rounded-[42px] shadow-2xl shadow-cyan-950/90 overflow-hidden ring-2 ring-cyan-500/50">
        
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

        {/* Carousel Header Selector / Story Bars */}
        <div className="absolute top-11 inset-x-0 z-30 px-3 flex flex-col gap-1 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-3 pt-1">
          <div className="flex gap-1.5">
            <button 
              onClick={() => setActiveSlide(0)}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === 0 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] scale-y-110' : 'bg-white/40 hover:bg-white/60'
              }`}
              title="Ir para Vídeo"
            />
            <button 
              onClick={() => setActiveSlide(1)}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === 1 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] scale-y-110' : 'bg-white/40 hover:bg-white/60'
              }`}
              title="Ir para Foto"
            />
          </div>

          {/* Quick Tab Labels */}
          <div className="flex justify-between items-center px-1 text-[9.5px] font-mono font-bold tracking-tight text-white/90">
            <button 
              onClick={() => setActiveSlide(0)}
              className={`flex items-center gap-1 transition-colors ${activeSlide === 0 ? 'text-cyan-300 font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <VideoIcon className="w-3 h-3 text-red-400" />
              <span>Vídeo (1/2)</span>
            </button>
            <button 
              onClick={() => setActiveSlide(1)}
              className={`flex items-center gap-1 transition-colors ${activeSlide === 1 ? 'text-cyan-300 font-extrabold' : 'text-slate-400 hover:text-white'}`}
            >
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>Foto (2/2)</span>
            </button>
          </div>
        </div>

        {/* Swipeable Screen Area */}
        <div 
          className="relative w-full aspect-[9/16] bg-black overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
        >
          {/* Slide 0: Video */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeSlide === 0 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            {isStarted ? (
              <iframe
                src="https://www.youtube.com/embed/OmoZTIh7DCs?autoplay=1&mute=1&loop=1&playlist=OmoZTIh7DCs&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3"
                title="ROSLEON YouTube Short"
                className="w-full h-full scale-[1.35] object-cover border-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="eager"
              />
            ) : (
              <div 
                onClick={() => setIsStarted(true)}
                className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer group transition-all"
              >
                <ImageWithFallback 
                  src="https://res.cloudinary.com/jfqsykts/image/upload/c_limit,w_420/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png"
                  backupSrc="https://res.cloudinary.com/jfqsykts/image/upload/c_limit,w_420/q_auto:eco/f_auto/v1786311280/ChatGPT_Image_16_de_jul._de_2026_16_19_14.png"
                  alt="Capa Vídeo ROSLEON"
                  initials="PLAY"
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
          </div>

          {/* Slide 1: Photo */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeSlide === 1 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <ImageWithFallback 
              src="https://res.cloudinary.com/jfqsykts/image/upload/v1786487067/photo_5177331699942100126_y.jpg"
              backupSrc="https://res.cloudinary.com/jfqsykts/image/upload/v1786487067/photo_5177331699942100126_y.jpg"
              alt="Rosleon Destaque"
              initials="RL"
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={300}
              height={533}
            />
          </div>

          {/* Carousel Left / Right Navigation Buttons Overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlide(0);
            }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/85 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all ${
              activeSlide === 0 ? 'opacity-30 cursor-not-allowed border-white/10' : 'opacity-95 cursor-pointer shadow-lg shadow-cyan-950/80 scale-105'
            }`}
            title="Ver Vídeo"
            disabled={activeSlide === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlide(1);
            }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/85 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all ${
              activeSlide === 1 ? 'opacity-30 cursor-not-allowed border-white/10' : 'opacity-95 cursor-pointer shadow-lg shadow-cyan-950/80 scale-105 animate-pulse'
            }`}
            title="Ver Foto"
            disabled={activeSlide === 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Prominent Overlay Swipe Pill (Inside Screen at Bottom) */}
          <div 
            onClick={() => setActiveSlide(activeSlide === 0 ? 1 : 0)}
            className="absolute bottom-3 inset-x-3 z-30 py-1.5 px-2.5 rounded-xl bg-slate-950/90 border border-cyan-400/60 text-cyan-300 backdrop-blur-md flex items-center justify-between shadow-xl cursor-pointer hover:bg-slate-900 transition-all active:scale-98 group"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-tight text-white">
              <MoveHorizontal className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span>Arraste p/ o lado</span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-500/30 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              <span>{activeSlide === 0 ? 'Ver Foto ›' : '‹ Ver Vídeo'}</span>
            </div>
          </div>
        </div>

        {/* Home Bar Indicator */}
        <div className="bg-slate-950 py-2 flex justify-center border-t border-slate-900 z-20 relative">
          <div className="w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      {/* Prominent External Banner Cue below Phone */}
      <div className="relative z-20 mt-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50 backdrop-blur-md flex items-center justify-center gap-2 text-xs font-mono font-semibold">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <button 
          onClick={() => setActiveSlide(0)} 
          className={`hover:underline cursor-pointer ${activeSlide === 0 ? 'text-white font-bold underline' : 'text-slate-400'}`}
        >
          1. Vídeo
        </button>
        <span className="text-slate-600">|</span>
        <button 
          onClick={() => setActiveSlide(1)} 
          className={`hover:underline cursor-pointer ${activeSlide === 1 ? 'text-white font-bold underline' : 'text-slate-400'}`}
        >
          2. Foto
        </button>
        <span className="text-slate-600">·</span>
        <span className="text-[11px] text-cyan-200/90 flex items-center gap-1">
          <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Arraste no celular
        </span>
      </div>
    </div>
  );
};



