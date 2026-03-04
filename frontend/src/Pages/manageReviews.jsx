import React, { useState, useEffect } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import useReviews from '../hooks/useReviews';
import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import { useNavbar } from '../contexts/NavbarContext';
import { useAuth } from '../contexts/AuthContext';
import ReviewsStarBreakdown from '../Components/ReviewsStarBreakdown';
import ReviewsList from '../Components/ReviewsList';
import { logger } from '../utils/helpers';
import { HiChatBubbleLeftRight, HiArrowPath, HiExclamationTriangle } from 'react-icons/hi2';

export default function ManageReviews() {
  const { isNavbarOpen } = useNavbar();
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  const userType = user?.userType?.toLowerCase() ?? null;
  const [activeTab, setActiveTab] = useState('manageReviews');
  const [loading, setLoading] = useState(true);
  const { fetchReviews, fetchStats, reviews, stats: reviewStats } = useReviews();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchReviews(userId).catch(err => logger.error('manageReviews: fetchReviews failed', err)),
      fetchStats(userId).catch(err => logger.error('manageReviews: fetchStats failed', err)),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const Shell = ({ children }) => (
    <>
      <ManageBusinessNavbar active={activeTab} onChange={setActiveTab} isNavbarOpen={isNavbarOpen} />
      <div className="relative min-h-screen w-full">
        <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-black z-0" />
        <HoneycombBackground opacity={0.12} />
        <PageTransition>
          <main className="relative z-10 pt-24 p-4 sm:p-6 text-yellow-200">
            {children}
          </main>
        </PageTransition>
      </div>
    </>
  );

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-yellow-200 text-lg font-semibold">
            <HiArrowPath className="w-6 h-6 animate-spin" />
            Loading reviews…
          </div>
        </div>
      </Shell>
    );
  }

  if (userType !== 'business' && userType !== 'businessuser' && userType !== 'business_user') {
    return (
      <Shell>
        <div className="max-w-lg mx-auto mt-20">
          <div className="bg-black/80 backdrop-blur-md rounded-3xl p-10 border border-yellow-400/20 text-center shadow-2xl">
            <HiExclamationTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-50 mb-3">Business Reviews</h2>
            <p className="text-yellow-200/70">You must be logged in as a business to view this page.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="max-w-4xl mx-auto mb-10 mt-14">
          <div className="relative bg-black/80 backdrop-blur-md border border-yellow-400/20 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-yellow-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-yellow-50 mb-2 flex items-center justify-center gap-3">
                <HiChatBubbleLeftRight className="w-8 h-8 text-yellow-400" />
                Customer Reviews
              </h1>
              <p className="text-yellow-200/70 text-base sm:text-lg leading-relaxed">
                See feedback and ratings from your customers
              </p>
            </div>
          </div>
        </div>

        <ReviewsStarBreakdown reviewStats={reviewStats} />

        <ReviewsList
          reviews={reviews}
          showLatestBadge={true}
          emptyStateConfig={{
            title: "No Reviews Yet",
            description: "You haven't received any reviews yet. Share your business card to start collecting feedback."
          }}
        />
      </div>
    </Shell>
  );
}

