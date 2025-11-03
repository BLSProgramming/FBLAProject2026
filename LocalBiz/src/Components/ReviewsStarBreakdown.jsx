import React from 'react';
import StarRating from './ui/StarRating';

export default function ReviewsStarBreakdown({ reviewStats, className = "" }) {
  // Provide safe defaults
  const safeStats = reviewStats || { 
    totalReviews: 0, 
    averageRating: 0.0, 
    starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } 
  };

  if (!safeStats || safeStats.totalReviews === 0) return null;
  
  const starMap = { 5: 'five', 4: 'four', 3: 'three', 2: 'two', 1: 'one' };
  
  return (
    <div className={`bg-black/80 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold text-yellow-100">{safeStats.averageRating} Stars</div>
          <div className="flex items-center">
            <StarRating rating={Math.round(safeStats.averageRating * 2) / 2} />
            <span className="ml-2 text-yellow-200">({safeStats.totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const starKey = starMap[stars];
          const count = safeStats.starBreakdown[starKey];
          const percentage = safeStats.totalReviews > 0 ? (count / safeStats.totalReviews) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center space-x-2">
              <span className="text-yellow-200 w-8">{stars}★</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-yellow-200 w-8 text-sm">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}