import React from 'react';

export default function StarRating({ rating = 0, interactive = false, onChange = null, size = 'text-2xl' }) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star) => {
    if (!interactive || typeof onChange !== 'function') return;
    onChange(star);
  };

  return (
    <div className="flex items-center space-x-1" role={interactive ? 'radiogroup' : undefined}>
        {(() => {
          const ratingValue = Math.max(0, Math.min(5, Number(rating) || 0));
          
          return stars.map((starIndex) => {
            // Determine fill percentage for this star
            const fillPercentage = Math.min(100, Math.max(0, (ratingValue - starIndex + 1) * 100));
            const isEmpty = fillPercentage === 0;
            const isFull = fillPercentage === 100;
            const isPartial = fillPercentage > 0 && fillPercentage < 100;
            
            const starId = `star-${starIndex}-${Math.random().toString(36).substr(2, 9)}`;
            
            return (
              <button
                key={starIndex}
                type={interactive ? 'button' : 'button'}
                onClick={() => handleClick(starIndex)}
                aria-label={interactive ? `Set rating ${starIndex}` : `Rating ${ratingValue.toFixed(1)}`}
                className={`${interactive ? 'cursor-pointer hover:scale-105 transform transition' : ''} relative inline-flex items-center justify-center p-0.5`}
              >
                <span className={`${size} block`} aria-hidden>
                  <span className="relative inline-block" style={{ width: '1em', height: '1em' }}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        {isPartial && (
                          <linearGradient id={starId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset={`${fillPercentage}%`} stopColor="currentColor" className="text-yellow-300" />
                            <stop offset={`${fillPercentage}%`} stopColor="currentColor" className="text-gray-400" />
                          </linearGradient>
                        )}
                      </defs>
                      <path 
                        d="M12 .587l3.668 7.568L24 9.75l-6 5.849L19.335 24 12 19.897 4.665 24 6 15.599 0 9.75l8.332-1.595z" 
                        fill={isPartial ? `url(#${starId})` : 'currentColor'}
                        className={isFull ? 'text-yellow-300' : isEmpty ? 'text-gray-400' : ''}
                      />
                    </svg>
                  </span>
                </span>
              </button>
            );
          });
        })()}
    </div>
  );
}