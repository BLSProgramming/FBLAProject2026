import React from 'react';

// Visual-only star rating component.
// Props:
// - rating: number (can be fractional, e.g., 4.5)
// - interactive: boolean (if true, stars are clickable and call onChange with an integer 1-5)
// - onChange: function(starNumber) => void
// - size: Tailwind text size class (optional, default 'text-2xl')
export default function StarRating({ rating = 0, interactive = false, onChange = null, size = 'text-2xl' }) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star) => {
    if (!interactive || typeof onChange !== 'function') return;
    onChange(star);
  };

  return (
    <div className="flex items-center space-x-1" role={interactive ? 'radiogroup' : undefined}>
      {stars.map((s) => {
        const fill = Math.max(0, Math.min(1, rating - (s - 1)));
        const widthPercent = Math.round(fill * 100);
        return (
          <button
            key={s}
            type={interactive ? 'button' : 'button'}
            onClick={() => handleClick(s)}
            aria-label={interactive ? `Set rating ${s}` : `Rating ${rating}`}
            className={`${interactive ? 'cursor-pointer hover:scale-105 transform transition' : ''} p-0.5 relative leading-none`}
            style={{ lineHeight: 0 }}
          >
            <span className={`${size} text-gray-400`} aria-hidden>
              ★
            </span>

            {/* colored overlay to show fractional fills */}
            <span
              className={`absolute top-0 left-0 overflow-hidden pointer-events-none`}
              style={{ width: `${widthPercent}%` }}
            >
              <span className={`${size} text-yellow-300`} aria-hidden>
                ★
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
