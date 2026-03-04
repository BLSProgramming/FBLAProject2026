import React from 'react';
import ReviewItem from './ReviewItem';
import { HiChatBubbleLeftEllipsis, HiChatBubbleBottomCenterText } from 'react-icons/hi2';

export default function ReviewsList({
  reviews,
  emptyStateConfig = {},
  containerClassName = '',
  dateFormat = 'standard',
  showLatestBadge = false,
}) {
  const emptyState = {
    title: 'No Reviews Yet',
    description: 'No reviews have been posted yet.',
    ...emptyStateConfig,
  };

  return (
    <div className={`bg-black/90 border border-yellow-300/20 rounded-3xl p-5 sm:p-8 shadow-2xl min-h-[300px] ${containerClassName}`}>
      {!reviews?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <HiChatBubbleBottomCenterText className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-300 mb-2">{emptyState.title}</h3>
          <p className="text-gray-500 max-w-sm">{emptyState.description}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h3 className="text-2xl font-bold text-yellow-50 flex items-center gap-2">
              <HiChatBubbleLeftEllipsis className="w-6 h-6 text-yellow-400" />
              Customer Reviews
              <span className="text-base font-normal text-yellow-200/60">({reviews.length})</span>
            </h3>
            <span className="text-sm text-yellow-300/50">Most recent first</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
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