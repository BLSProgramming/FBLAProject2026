import React from 'react';
import StarRating from './ui/StarRating';
import { HiUserCircle } from 'react-icons/hi2';

export default function ReviewItem({ review, index = null, showLatestBadge = false, dateFormat = 'standard' }) {
  const isLatest = showLatestBadge && index === 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (dateFormat === 'extended') {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const displayName = review.username || review.reviewerName || `User ${review.userId}`;
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="bg-gray-900/50 rounded-2xl p-5 sm:p-6 border border-yellow-300/10 hover:border-yellow-300/20 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          {initials ? (
            <span className="text-sm font-bold text-yellow-300">{initials}</span>
          ) : (
            <HiUserCircle className="w-7 h-7 text-yellow-400/60" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <span className="font-semibold text-yellow-50 text-base">{displayName}</span>
            <div className="flex items-center gap-1.5">
              <StarRating rating={review.rating} size="text-lg" />
              <span className="text-yellow-300/70 text-sm font-medium">({review.rating}/5)</span>
            </div>
            {isLatest && (
              <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-green-400/20">
                Latest
              </span>
            )}
          </div>

          {/* Date */}
          <p className="text-xs text-yellow-200/40 mb-3">{formatDate(review.createdAt)}</p>

          {/* Review text */}
          <p className="text-yellow-200/80 leading-relaxed">{review.reviewText}</p>
        </div>
      </div>
    </div>
  );
}