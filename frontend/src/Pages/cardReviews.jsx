import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/BusinessCardNavbar.jsx';
import StarRating from '../Components/ui/StarRating.jsx';
import useReviews from '../hooks/useReviews.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useModal } from '../contexts/ModalContext.jsx';
import PageShell from '../Components/PageShell.jsx';
import ReviewsStarBreakdown from '../Components/ReviewsStarBreakdown.jsx';
import ReviewsList from '../Components/ReviewsList.jsx';
import { logger } from '../utils/helpers.js';
import { businessAPI } from '../utils/api.js';

export default function CardReviews(){
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('reviews');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [submitting, setSubmitting] = useState(false);

  // Use custom hooks
  const { user } = useAuth();
  const userType = user?.userType ?? null;
  const userId = user?.userId ? Number(user.userId) : null;
  const { showAlert } = useModal();

  useEffect(() => {
    logger.info('cardReviews: detected userType=', userType, 'userId=', userId);
    fetchBusinessInfo();
  }, [slug]);

  const { reviews, stats: reviewStats, fetchReviews, fetchStats, postReview, loading: reviewsLoading } = useReviews();

  useEffect(() => {
    if (businessInfo) {
      fetchReviews(businessInfo.id);
      fetchStats(businessInfo.id);
    }
  }, [businessInfo]);

  const fetchBusinessInfo = async () => {
    try {
      logger.info('Fetching business info for slug:', slug);
      const data = await businessAPI.getCard(slug);
      logger.info('Business info data:', data);
      setBusinessInfo(data);
    } catch (error) {
      logger.error('Error fetching business info:', error);
    }
  };

  // Set page loading while businessInfo is missing or while reviews are loading
  useEffect(() => {
    setLoading(businessInfo == null || !!reviewsLoading);
  }, [businessInfo, reviewsLoading]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!businessInfo?.id) {
        await showAlert('Unable to submit review: business information not loaded.');
        setSubmitting(false);
        return;
      }

      const payload = { businessUserId: businessInfo.id, userId: userId, rating: newReview.rating, reviewText: newReview.reviewText };
      try {
        await postReview(payload);
        setNewReview({ rating: 5, reviewText: '' });
        await fetchReviews(businessInfo.id);
        await fetchStats(businessInfo.id);
      } catch (err) {
        try { const data = err?.message ? JSON.parse(err.message) : null; await showAlert(data?.message || err.message || 'Error submitting review', 'Error'); } catch { await showAlert(err.message || 'Error submitting review', 'Error'); }
      }
    } catch (error) {
      logger.error('Error submitting review:', error);
      await showAlert('Error submitting review', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  



  if (loading) {
    return (
      <PageShell>
        <BusinessCardNavbar active={activeTab} onChange={setActiveTab} slug={slug} />
        <main className="relative z-10 pt-28 p-8 text-yellow-200">
          <div className="text-center">Loading reviews...</div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <BusinessCardNavbar active={activeTab} onChange={setActiveTab} slug={slug} />
      
        {/* Main Reviews Area */}
        <main className="relative z-10 pt-28 p-8 text-yellow-200">
  <div className="max-w-6xl mx-auto bg-black/80 border border-yellow-300/20 rounded-lg p-8">
          {/* Header Section with centered black card behind it (text inside the card) */}
          <div className="mb-8 relative">
            {/* centered black card with header text inside */}
            <div className="mt-4 absolute left-1/2 transform -translate-x-1/2 -top-6 z-0 w-full max-w-5xl">
              <div className="bg-black/80 rounded-3xl px-8 py-6 shadow-2xl mx-auto">
                <div className="text-center">
                  <h2 className="text-4xl text-yellow-100 font-bold mb-2">
                    Reviews for {businessInfo?.businessName || slug}
                  </h2>
                  <p className="text-yellow-200/80 text-xl">
                    See what customers are saying about this business
                  </p>
                </div>
              </div>
            </div>
            {/* spacer to preserve layout flow - match card height so it doesn't overlap reviews */}
            <div className="h-28" />
          </div>

          <ReviewsStarBreakdown reviewStats={reviewStats} />

          <ReviewsList 
            reviews={reviews}
            showLatestBadge={true}
            dateFormat="extended"
            containerClassName="bg-transparent min-h-[600px]"
            emptyStateConfig={{
              title: "No Reviews Yet",
              description: "This business hasn't received any reviews yet. Be the first to share your experience!",
              className: "h-full"
            }}
          />
        </div>
      </main>

      
      {userType === 'user' && (
        <div className="mt-2 -mt-8 relative z-20 pb-12">
          <div className="max-w-6xl mx-auto p-6 bg-black/90 backdrop-blur-sm border-t border-yellow-500/30 rounded-xl shadow-xl">
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-yellow-100">Write a Review</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-yellow-200">Rating:</span>
                  <StarRating rating={newReview.rating} interactive={true} onChange={(rating) => setNewReview(prev => ({ ...prev, rating }))} />
                  <span className="text-yellow-300 font-medium">
                    ({newReview.rating} star{newReview.rating !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  className="flex-1 p-4 rounded-lg bg-black/50 text-yellow-100 placeholder-yellow-300/50 border border-yellow-500/30 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 resize-none"
                  rows="4"
                  placeholder="Share your experience with this business... (minimum 10 characters)"
                  required
                  minLength="10"
                  maxLength="1000"
                />
                <button
                  type="submit"
                  disabled={submitting || newReview.reviewText.length < 10}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg flex items-center space-x-2 whitespace-nowrap"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      <span>Post Review</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className={`${newReview.reviewText.length < 10 ? 'text-red-400' : 'text-yellow-300/70'}`}>
                  {newReview.reviewText.length}/1000 characters
                  {newReview.reviewText.length < 10 && (
                    <span className="text-red-400 ml-2">(minimum 10 required)</span>
                  )}
                </div>
                {newReview.reviewText.length >= 10 && (
                  <span className="text-green-400">✓ Ready to post</span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </PageShell>
  );
}
