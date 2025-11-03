import React from 'react';
import StarRating from './ui/StarRating';

export default function ReviewItem({ review, index = null, showLatestBadge = false, dateFormat = "standard" }) {
  const isLatest = showLatestBadge && index === 0;
  
  // Format date based on the format prop
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    if (dateFormat === "extended") {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    }
    
    // Default "standard" format
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      key={review.id || index} 
      className="bg-black/80 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-semibold text-yellow-100 text-xl">
                {review.username || review.reviewerName || `User ${review.userId}`}
              </span>
              <div className="flex items-center space-x-2">
                <StarRating rating={review.rating} />
                <span className="text-yellow-300 font-medium text-lg">({review.rating}/5)</span>
              </div>
            </div>
            <p className="text-yellow-300/70">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        {isLatest && (
          <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
            Latest
          </div>
        )}
      </div>

      <div className="pl-0.5">
        <p className="text-yellow-200 leading-relaxed text-lg">{review.reviewText}</p>
      </div>
    </div>
  );
}