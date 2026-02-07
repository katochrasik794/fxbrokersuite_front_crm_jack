import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';

function TickerImageModal({ imageUrl, title, duration = 5, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for fade out animation
  };

  // Construct full image URL
  const fullImageUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${API_BASE_URL.replace(/\/api\/?$/, '')}${imageUrl}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        transition: 'opacity 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] w-full"
        style={{
          transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          opacity: isVisible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Image container */}
        <div className="p-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pr-8">
              {title}
            </h3>
          )}
          <div className="relative w-full" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            <img
              src={fullImageUrl}
              alt={title || 'Ticker image'}
              className="w-full h-auto object-contain rounded-lg"
              style={{ maxHeight: 'calc(90vh - 100px)' }}
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
                e.target.alt = 'Image not found';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TickerImageModal;

