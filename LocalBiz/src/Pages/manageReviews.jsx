import React, { useState, useEffect } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import useReviews from '../hooks/useReviews';
import useUserData from '../hooks/useUserData';
import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import { useNavbar } from '../contexts/NavbarContext';
import ReviewsStarBreakdown from '../Components/ReviewsStarBreakdown';
import ReviewsList from '../Components/ReviewsList';

export default function ManageReviews() {
	const { isNavbarOpen } = useNavbar();
	const [activeTab, setActiveTab] = useState('manageReviews');
	const [loading, setLoading] = useState(true);

	// Use custom hooks
	const { userType, userId } = useUserData();
	const { fetchReviews, fetchStats, reviews, stats: reviewStats } = useReviews();

	useEffect(() => {
		if (!userId) { setLoading(false); return; }
		setLoading(true);
		fetchReviews(userId).catch(err => { console.error('manageReviews: fetchReviews failed', err); })
		  .finally(() => setLoading(false));
		fetchStats(userId).catch(err => { console.error('manageReviews: fetchStats failed', err); });
	}, [userId]);



	const PageLayout = ({ children }) => (
		<>
			{/* Management Navbar - Fixed outside main content */}
			<ManageBusinessNavbar active={activeTab} onChange={setActiveTab} isNavbarOpen={isNavbarOpen} />
			
			{/* Main Content Area */}
			<div className="relative min-h-screen w-full">
				{/* Background layer that covers full viewport */}
				<div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-black z-0"></div>
				<HoneycombBackground opacity={0.12} />
				<PageTransition>
					<main className="relative z-10 pt-28 p-8 text-yellow-200">
						{children}
					</main>
				</PageTransition>
			</div>
		</>
	);

	if (loading) {
		return (
			<PageLayout>
				<div className="text-center">Loading reviews...</div>
			</PageLayout>
		);
	}

	if (userType !== 'business' && userType !== 'businessuser' && userType !== 'business_user') {
		return (
			<PageLayout>
				<div className="max-w-4xl mx-auto text-center">
					<div className="bg-black/80 rounded-2xl p-8"> 
						<h2 className="text-2xl font-bold mb-4">Business Reviews</h2>
						<p className="text-yellow-200">You must be logged in as a business to view this page.</p>
					</div>
				</div>
			</PageLayout>
		);
	}

	return (
		<PageLayout>
			<div className="max-w-6xl mx-auto">
					<div className="mb-8 relative">
						<div className="mt-4 absolute left-1/2 transform -translate-x-1/2 -top-6 z-0 w-full max-w-3xl">
							<div className="bg-black/90 rounded-3xl px-8 py-6 shadow-2xl mx-auto">
								<div className="text-center">
									<h2 className="text-4xl text-yellow-100 font-bold mb-2">Reviews for your business</h2>
									<p className="text-yellow-200/80 text-xl">See customer feedback and ratings</p>
								</div>
							</div>
						</div>
						<div className="h-28" />
					</div>

					<ReviewsStarBreakdown reviewStats={reviewStats} />

					<ReviewsList 
						reviews={reviews}
						showLatestBadge={true}
						emptyStateConfig={{
							title: "No Reviews Yet",
							description: "You haven't received any reviews yet."
						}}
					/>
				</div>
		</PageLayout>
	);
}

