import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

export const PhoneMockup: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState<number>(0);

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

        {/* Carousel Story Indicators (Top Bars) */}
        <div className="absolute top-11 inset-x-0 z-30 px-3 flex gap-1.5 pointer-events-none">
          <button 
            onClick={() => setActiveSlide(0)}
            className={`h-1 flex-1 rounded-full transition-all duration-300 cursor-pointer pointer-events-auto ${
              activeSlide === 0 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'bg-white/30 hover:bg-white/50'
            }`} 
            title="Vídeo"
          />
          <button 
            onClick={() => setActiveSlide(1)}
            className={`h-1 flex-1 rounded-full transition-all duration-300 cursor-pointer pointer-events-auto ${
              activeSlide === 1 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'bg-white/30 hover:bg-white/50'
            }`} 
            title="Foto"
          />
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
            <iframe
              src="https://www.youtube.com/embed/OmoZTIh7DCs?autoplay=1&mute=1&loop=1&playlist=OmoZTIh7DCs&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3"
              title="ROSLEON YouTube Short"
              className="w-full h-full scale-[1.35] object-cover border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="eager"
            />
            {/* Transparent blocker to prevent YouTube native pause/play icon overlay on click */}
            <div className="absolute inset-0 z-20 bg-transparent" />
          </div>

          {/* Slide 1: Photo */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${activeSlide === 1 ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <ImageWithFallback 
              src="https://res.cloudinary.com/jfqsykts/image/upload/v1786487067/photo_5177331699942100126_y.jpg"
              backupSrc="https://res.cloudinary.com/jfqsykts/image/upload/v1786487067/photo_5177331699942100126_y.jpg"
              alt="Rosleon Destaque"
              initials="RL"
              className="w-full h-full object-cover pointer-events-none"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={300}
              height={533}
            />
          </div>

          {/* Carousel Side Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlide(0);
            }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/80 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all ${
              activeSlide === 0 ? 'opacity-20 cursor-not-allowed border-white/10' : 'opacity-90 cursor-pointer shadow-lg shadow-cyan-950/80 scale-105'
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
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-slate-950/80 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all ${
              activeSlide === 1 ? 'opacity-20 cursor-not-allowed border-white/10' : 'opacity-90 cursor-pointer shadow-lg shadow-cyan-950/80 scale-105'
            }`}
            title="Ver Foto"
            disabled={activeSlide === 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Compact Low-Profile Swipe Pill (Positioned at bottom edge) */}
          <div 
            onClick={() => setActiveSlide(activeSlide === 0 ? 1 : 0)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 py-1 px-3 rounded-full bg-slate-950/80 border border-cyan-400/50 text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer hover:bg-slate-900 hover:border-cyan-300 transition-all active:scale-95 group text-[10px] font-mono whitespace-nowrap"
          >
            <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="text-white font-medium">Arraste para o lado</span>
            <span className="text-cyan-400 font-bold ml-0.5 group-hover:translate-x-0.5 transition-transform">
              {activeSlide === 0 ? '›' : '‹'}
            </span>
          </div>
        </div>

        {/* Home Bar Indicator */}
        <div className="bg-slate-950 py-2 flex justify-center border-t border-slate-900 z-20 relative">
          <div className="w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};



