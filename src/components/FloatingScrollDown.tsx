import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const FloatingScrollDown: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;
      
      // Hide button when within 350px from the bottom of the page
      if (totalHeight - scrollPosition < 350) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollDown = () => {
    window.scrollBy({
      top: Math.max(window.innerHeight * 0.75, 400),
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 animate-fade-in">
      <button
        onClick={handleScrollDown}
        aria-label="Rolar para baixo"
        className="group relative flex items-center justify-center p-3.5 sm:p-4 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-[0_0_30px_rgba(250,204,21,0.85)] border-2 border-slate-950 ring-4 ring-amber-400/30 hover:ring-amber-400/60 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer animate-bounce"
      >
        <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5] text-slate-950 group-hover:translate-y-0.5 transition-transform" />
        <span className="absolute -inset-1 rounded-full bg-amber-400/30 blur-md -z-10 group-hover:bg-amber-400/60 transition-all" />
      </button>
    </div>
  );
};
