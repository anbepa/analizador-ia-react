import React, { useState } from 'react';

/**
 * Optimized image component with loading state and skeleton
 */
const OptimizedImage = ({ 
  src, 
  alt = "Evidencia", 
  className = "", 
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback icon for errors or missing src
  const Fallback = () => (
    <div className={`flex flex-col items-center justify-center bg-secondary-100 rounded-xl animate-fade-in ${className}`}>
      <svg className="w-12 h-12 text-secondary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Error al cargar imagen</p>
    </div>
  );

  // Loading Skeleton
  const Skeleton = () => (
    <div className={`absolute inset-0 bg-gradient-to-r from-secondary-100 via-secondary-50 to-secondary-100 bg-[length:200%_100%] animate-shimmer rounded-xl z-10 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Descargando...</p>
        </div>
    </div>
  );

  if (!src || hasError) {
    return <Fallback />;
  }

  return (
    <div className="relative overflow-hidden flex items-center justify-center w-full h-full">
      {!isLoaded && <Skeleton />}
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          setHasError(true);
          if (onError) onError(e);
        }}
        className={`transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;