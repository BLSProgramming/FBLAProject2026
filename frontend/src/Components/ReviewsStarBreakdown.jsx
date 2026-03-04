import React from 'react';
import StarRating from './ui/StarRating';
import { HiStar } from 'react-icons/hi2';

const STAR_MAP = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };

export default function ReviewsStarBreakdown({ reviewStats, className = '' }) {
  const safeStats = reviewStats || {
    totalReviews: 0,
    averageRating: 0.0,
    starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
  };

  if (!safeStats || safeStats.totalReviews === 0) return null;

  return (
    <div className={`bg-black/90 border border-yellow-300/20 rounded-3xl p-5 sm:p-8 shadow-2xl mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
        {/* Big score */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-yellow-300">{Number(safeStats.averageRating).toFixed(1)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <StarRating rating={Math.round(safeStats.averageRating * 2) / 2} size="text-xl" />
            </div>
            <p className="text-sm text-yellow-200/50">
              Based on {safeStats.totalReviews} review{safeStats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Bar breakdown */}
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = safeStats.starBreakdown[STAR_MAP[stars]] ?? 0;
          const pct = safeStats.totalReviews > 0 ? (count / safeStats.totalReviews) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-medium text-yellow-200 w-10 justify-end tabular-nums">
                {stars} <HiStar className="w-3.5 h-3.5 text-yellow-400" />
              </span>
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-yellow-200/50 w-8 text-right tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}