import React from 'react';
import ReviewItem from './ReviewItem';

export default function ReviewsList({ 
  reviews, 
  emptyStateConfig = {}, 
  containerClassName = "",
  dateFormat = "standard",
  showLatestBadge = false
}) {
  // Default empty state configuration
  const defaultEmptyState = {
    icon: "📝",
    title: "No Reviews Yet",
    description: "No reviews have been posted yet.",
    className: ""
  };
  
  const emptyState = { ...defaultEmptyState, ...emptyStateConfig };

  return (
    <div className={`bg-black/80 rounded-2xl p-8 min-h-[300px] border border-yellow-500/20 ${containerClassName}`}>
      {(!reviews?.length) ? (
        <div className={`flex flex-col items-center justify-center h-64 text-center py-16 ${emptyState.className}`}>
          <div className="mb-6">
            <span className="text-8xl opacity-30">{emptyState.icon}</span>
          </div>
          <h3 className="text-3xl font-semibold text-yellow-100 mb-4">{emptyState.title}</h3>
          <p className="text-yellow-200/80 text-lg max-w-md">{emptyState.description}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-yellow-100">Customer Reviews ({reviews.length})</h3>
            <div className="text-yellow-300/70">Most recent first</div>
          </div>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
            {reviews.map((review, idx) => (
              <ReviewItem
                key={review.id || idx}
                review={review}
                index={idx}
                showLatestBadge={showLatestBadge}
                dateFormat={dateFormat}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}