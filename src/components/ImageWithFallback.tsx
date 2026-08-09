import React, { useState, useEffect, useRef } from 'react';
import { User, Sparkles } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  backupSrc?: string;
  alt: string;
  initials?: string;
  className?: string;
  containerClassName?: string;
  timeoutMs?: number;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  backupSrc,
  alt,
  initials = "RL",
  className = "",
  containerClassName = "",
  timeoutMs = 3500,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if src prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Handle timeout for slow/hanging images
  useEffect(() => {
    if (isLoading && !hasError) {
      timerRef.current = setTimeout(() => {
        if (backupSrc && currentSrc !== backupSrc) {
          setCurrentSrc(backupSrc);
          setIsLoading(true);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      }, timeoutMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentSrc, backupSrc, isLoading, hasError, timeoutMs]);

  const handleLoad = () => {
    setIsLoading(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleError = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (backupSrc && currentSrc !== backupSrc) {
      setCurrentSrc(backupSrc);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  if (hasError) {
    return (
      <div className={`w-full h-full min-h-[160px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 text-amber-400 p-6 select-none text-center ${containerClassName}`}>
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
          <User className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-amber-300 uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{initials}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">ROSLEON</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${containerClassName}`}>
      {/* Skeleton loading animation while waiting for network response */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-10 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-amber-500/20 flex items-center justify-center mb-2">
            <User className="w-6 h-6 text-amber-500/50" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Carregando...</span>
        </div>
      )}

      <img
        {...props}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
};

