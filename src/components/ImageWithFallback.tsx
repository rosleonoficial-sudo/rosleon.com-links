import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  backupSrc?: string;
  alt: string;
  initials?: string;
  className?: string;
}

const DEFAULT_LOCAL_IMAGE = "/images/rosleon-profile.webp";

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  backupSrc,
  alt,
  initials = "RL",
  className = "",
  onError,
  ...props
}) => {
  // Helper to sanitize broken/expired third-party URLs
  const sanitizeUrl = (urlStr: string): string => {
    if (!urlStr) return DEFAULT_LOCAL_IMAGE;
    if (urlStr.includes('res.cloudinary.com')) {
      return DEFAULT_LOCAL_IMAGE;
    }
    return urlStr;
  };

  const initialSrc = sanitizeUrl(src);
  const initialBackup = backupSrc ? sanitizeUrl(backupSrc) : DEFAULT_LOCAL_IMAGE;

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if src prop changes
  useEffect(() => {
    const nextSrc = sanitizeUrl(src);
    setCurrentSrc(nextSrc);
    setHasError(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (initialBackup && currentSrc !== initialBackup) {
      setCurrentSrc(initialBackup);
    } else if (currentSrc !== DEFAULT_LOCAL_IMAGE) {
      setCurrentSrc(DEFAULT_LOCAL_IMAGE);
    } else {
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
