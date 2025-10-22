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
          
          const display = Math.max(0, Math.min(5, Math.floor(Number(rating) || 0)));
          return stars.map((s) => {
            const filled = s <= display;
            return (
              <button
                key={s}
                type={interactive ? 'button' : 'button'}
                onClick={() => handleClick(s)}
                aria-label={interactive ? `Set rating ${s}` : `Rating ${display}`}
                className={`${interactive ? 'cursor-pointer hover:scale-105 transform transition' : ''} relative inline-flex items-center justify-center p-0.5`}
              >
                <span className={`${size} block`} aria-hidden>
                  <span className="relative inline-block" style={{ width: '1em', height: '1em' }}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={`absolute inset-0 w-full h-full ${filled ? 'text-yellow-300' : 'text-gray-400'} fill-current`} preserveAspectRatio="xMidYMid meet">
                      <path d="M12 .587l3.668 7.568L24 9.75l-6 5.849L19.335 24 12 19.897 4.665 24 6 15.599 0 9.75l8.332-1.595z" />
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
