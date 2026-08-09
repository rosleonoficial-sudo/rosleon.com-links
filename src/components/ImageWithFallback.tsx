import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  backupSrc?: string;
  alt: string;
  initials?: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  backupSrc,
  alt,
  initials = "RL",
  className = "",
  onError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if src prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (backupSrc && currentSrc !== backupSrc) {
      // Try backup image url
      setCurrentSrc(backupSrc);
    } else {
      // Both primary and backup failed
      setHasError(true);
    }
    if (onError) {
      onError(e);
    }
  };

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-slate-900 border border-amber-500/30 text-amber-400 select-none text-center ${className}`}
        style={{ minWidth: '40px', minHeight: '40px' }}
      >
        <User className="w-1/2 h-1/2 max-w-[32px] max-h-[32px] text-amber-400 mb-0.5" />
        {initials && (
          <span className="text-[10px] font-bold tracking-widest text-amber-300 uppercase leading-none">
            {initials}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  );
};
