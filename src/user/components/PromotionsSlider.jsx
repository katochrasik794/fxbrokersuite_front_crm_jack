import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PromotionsSlider() {
  const [promotions, setPromotions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const AUTO_ROTATE_INTERVAL = 5000; // 5 seconds

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (promotions.length > 1) {
      startAutoRotate();
      return () => stopAutoRotate();
    }
  }, [promotions.length, currentIndex]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/promotions?is_active=true`);
      const data = await response.json();
      if (data.success && data.data) {
        setPromotions(data.data);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRotate = () => {
    stopAutoRotate();
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, AUTO_ROTATE_INTERVAL);
  };

  const stopAutoRotate = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    startAutoRotate();
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    startAutoRotate();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
    startAutoRotate();
  };

  const getButtonPositionClasses = (position) => {
    const positions = {
      'right-center': 'right-4 top-1/2 -translate-y-1/2',
      'left-center': 'left-4 top-1/2 -translate-y-1/2',
      'center': 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
      'right-top': 'right-4 top-4',
      'left-top': 'left-4 top-4',
      'right-bottom': 'right-4 bottom-4',
      'left-bottom': 'left-4 bottom-4',
    };
    return positions[position] || positions['right-center'];
  };

  if (loading) {
    return null;
  }

  if (promotions.length === 0) {
    return null;
  }

  const currentPromotion = promotions[currentIndex];

  return (
    <div 
      className="relative rounded-lg overflow-hidden mt-8 sm:mt-10 w-full"
      onMouseEnter={stopAutoRotate}
      onMouseLeave={startAutoRotate}
    >
      {/* Slider Container - Fixed size 1920x310, responsive */}
      <div 
        className="relative mx-auto"
        style={{ 
          width: '100%',
          maxWidth: '1920px',
          height: 'auto',
          aspectRatio: '1920/310'
        }}
      >
        {/* Image */}
        <img
          src={`${API_BASE_URL.replace('/api', '')}${currentPromotion.image_url}`}
          alt={currentPromotion.title || 'Promotion'}
          className="w-full h-full object-cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Button Overlay */}
        {currentPromotion.button_text && (
          <div className={`absolute ${getButtonPositionClasses(currentPromotion.button_position)} z-10`}>
            {currentPromotion.button_link ? (
              <a
                href={currentPromotion.button_link}
                target={currentPromotion.button_link.startsWith('http') ? '_blank' : '_self'}
                rel={currentPromotion.button_link.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-brand-500 hover:bg-brand-600 text-dark-base px-6 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base transition-colors font-medium shadow-lg"
              >
                {currentPromotion.button_text}
              </a>
            ) : (
              <button
                className="bg-brand-500 hover:bg-brand-600 text-dark-base px-6 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base transition-colors font-medium shadow-lg"
              >
                {currentPromotion.button_text}
              </button>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {promotions.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-20"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-20"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {promotions.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {promotions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-brand-500 w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

