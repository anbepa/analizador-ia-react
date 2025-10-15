import React from 'react';

/**
 * Simple image component - just shows the image directly
 */
const OptimizedImage = ({ 
  src, 
  alt = "Image", 
  className = "", 
  onLoad = null,
  onError = null,
  ...props 
}) => {
  // Simple validation - if no src or invalid src, show error
  if (!src || !src.startsWith('data:image/')) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-1 text-xs">Sin imagen</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={onError}
      className={className}
      {...props}
    />
  );
};

export default OptimizedImage;