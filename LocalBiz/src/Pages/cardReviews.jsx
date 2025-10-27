import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/businessCardNavbar';
import StarRating from '../Components/StarRating';
import useReviews from '../hooks/useReviews';
import HoneycombBackground from '../Components/HoneycombBackground';

export default function CardReviews(){
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('reviews');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let uType = null;
    let uId = null;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        uType = userData?.userType ?? userData?.type ?? null;
        uId = userData?.id ?? userData?.userId ?? null;
      } catch (e) {
        // If parsing fails, fall back to individual keys
      }
    }

    if (!uType) {
      uType = localStorage.getItem('userType');
    }
    if (!uId) {
      uId = localStorage.getItem('userId');
    }

    // Normalize userType to lowercase string for consistent checks
    if (uType && typeof uType === 'string') {
      uType = uType.toLowerCase();
    }

    if (uType) setUserType(uType);
    if (uId) setUserId(Number(uId));

    console.log('cardReviews: detected userType=', uType, 'userId=', uId);

    fetchBusinessInfo();
  }, [slug]);

  const { reviews: loadedReviews, stats: loadedStats, fetchReviews, fetchStats, postReview, loading: reviewsLoading } = useReviews();

  useEffect(() => {
    if (businessInfo) {
      fetchReviews(businessInfo.id);
      fetchStats(businessInfo.id);
    }
  }, [businessInfo]);

  const fetchBusinessInfo = async () => {
    try {
      console.log('Fetching business info for slug:', slug);
      const response = await fetch(`http://localhost:5236/api/ManageBusiness/slug/${slug}`);
      console.log('Business info response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Business info data:', data);
        setBusinessInfo(data);
      } else {
        console.error('Business info fetch failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  };

  // reviews and stats are handled by useReviews hook and loaded into local variables
  useEffect(() => {
    setReviews(loadedReviews || []);
    setReviewStats(loadedStats || { totalReviews: 0, averageRating: 0.0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } });
  }, [loadedReviews, loadedStats]);

  // Set page loading while businessInfo is missing or while reviews are loading
  useEffect(() => {
    setLoading(businessInfo == null || !!reviewsLoading);
  }, [businessInfo, reviewsLoading]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!businessInfo?.id) {
        alert('Unable to submit review: business information not loaded.');
        setSubmitting(false);
        return;
      }

      const payload = { businessUserId: businessInfo.id, userId: userId, rating: newReview.rating, reviewText: newReview.reviewText };
      try {
        await postReview(payload);
        setNewReview({ rating: 5, reviewText: '' });
        setShowReviewForm(false);
        await fetchReviews(businessInfo.id);
        await fetchStats(businessInfo.id);
      } catch (err) {
        try { const data = err?.message ? JSON.parse(err.message) : null; alert(data?.message || err.message || 'Error submitting review'); } catch { alert(err.message || 'Error submitting review'); }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  

  const StarBreakdown = () => {
    if (!reviewStats || reviewStats.totalReviews === 0) return null;

    return (
      <div className="bg-black/80 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-yellow-100">{reviewStats.averageRating} Stars</div>
            <div className="flex items-center">
              <StarRating rating={Math.round(reviewStats.averageRating * 2) / 2} />
              <span className="ml-2 text-yellow-200">({reviewStats.totalReviews} reviews )</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center space-x-2">
              <span className="text-yellow-200 w-8">{stars}★</span>
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ 
                    width: `${reviewStats.totalReviews > 0 ? (reviewStats.starBreakdown[
                      stars === 5 ? 'five' : 
                      stars === 4 ? 'four' : 
                      stars === 3 ? 'three' : 
                      stars === 2 ? 'two' : 'one'
                    ] / reviewStats.totalReviews) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-yellow-200 w-8 text-sm">
                {reviewStats.starBreakdown[
                  stars === 5 ? 'five' : 
                  stars === 4 ? 'four' : 
                  stars === 3 ? 'three' : 
                  stars === 2 ? 'two' : 'one'
                ]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
        <HoneycombBackground />
        <BusinessCardNavbar active={activeTab} onChange={setActiveTab} slug={slug} />
        <main className="relative z-10 pt-28 p-8 text-yellow-200">
          <div className="text-center">Loading reviews...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
  <HoneycombBackground />
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

          <StarBreakdown />

          {/* Large Reviews Display Area */}
          <div className="bg-transparent rounded-2xl p-8 min-h-[600px]">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="mb-6">
                  <span className="text-8xl opacity-30">📝</span>
                </div>
                <h3 className="text-3xl font-semibold text-yellow-100 mb-4">No Reviews Yet</h3>
                <p className="text-yellow-200/80 text-lg max-w-md">
                  This business hasn't received any reviews yet. Be the first to share your experience!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-yellow-100">
                    Customer Reviews ({reviews.length})
                  </h3>
                  <div className="text-yellow-300/70">
                    Most recent first
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                  {reviews.map((review, index) => (
                    <div key={review.id} className="bg-black/80 rounded-xl p-6 border border-yellow-300/20 hover:border-yellow-300/40 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-yellow-100 text-xl">{review.username || review.reviewerName || `User ${review.userId}`}</span>
                              <div className="flex items-center space-x-2">
                                <StarRating rating={review.rating} />
                                <span className="text-yellow-300 font-medium text-lg">({review.rating}/5)</span>
                              </div>
                            </div>
                            <p className="text-yellow-300/70">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {index === 0 && (
                          <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                            Latest
                          </div>
                        )}
                      </div>
                      
                      <div className="pl-0.5">
                        <p className="text-yellow-200 leading-relaxed text-lg">{review.reviewText}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
    </div>
  );
}
