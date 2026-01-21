import React, { useState } from 'react';

/**
 * SafeImage component with error handling for missing images
 * Prevents 404 errors and shows a fallback when image fails to load
 */
function SafeImage({ 
  src, 
  alt = '', 
  fallback = null, 
  className = '',
  onError,
  ...props 
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If error occurred, show fallback
  if (hasError) {
    if (fallback) {
      return typeof fallback === 'string' ? (
        <img src={fallback} alt={alt} className={className} {...props} />
      ) : (
        fallback
      );
    }
    // Default fallback: show a placeholder div
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        {...props}
      >
        <svg 
          className="w-6 h-6 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  // Render image with error handling
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      style={{ display: isLoading ? 'none' : 'block' }}
      {...props}
    />
  );
}

export default SafeImage;

