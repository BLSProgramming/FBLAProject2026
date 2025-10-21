import React, { useState, useEffect } from 'react';
import ManageBusinessNavbar from '../Components/manageBusinessNavbar';
import StarRating from '../Components/StarRating';
import useReviews from '../hooks/useReviews';
import HoneycombBackground from '../Components/HoneycombBackground';

export default function ManageReviews() {
	const [activeTab, setActiveTab] = useState('manageReviews');
	const [userType, setUserType] = useState(null);
	const [userId, setUserId] = useState(null);
	const [reviews, setReviews] = useState([]);
	const [reviewStats, setReviewStats] = useState(null);
	const [loading, setLoading] = useState(true);

	// call useReviews at top level
	const { fetchReviews, fetchStats, reviews: loadedReviews, stats: loadedStats } = useReviews();

	useEffect(() => {
		// detect userType and userId from storage (support legacy and current keys)
		let uType = null;
		let uId = null;
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			try {
				const ud = JSON.parse(storedUser);
				uType = ud?.userType ?? ud?.type ?? null;
				uId = ud?.id ?? ud?.userId ?? null;
			} catch (parseErr) {
				console.debug('manageReviews: failed to parse user object', parseErr);
			}
		}
		if (!uType) uType = localStorage.getItem('userType');
		if (!uId) uId = localStorage.getItem('userId');
		if (uType && typeof uType === 'string') uType = uType.toLowerCase();
		setUserType(uType);
		setUserId(uId ? Number(uId) : null);
	}, []);

	useEffect(() => {
		if (!userId) { setLoading(false); return; }
		setLoading(true);
		fetchReviews(userId).catch(err => { console.error('manageReviews: fetchReviews failed', err); })
		  .finally(() => setLoading(false));
		fetchStats(userId).catch(err => { console.error('manageReviews: fetchStats failed', err); });
	}, [userId]);

	// sync hook outputs into local state
	useEffect(() => {
		setReviews(loadedReviews || []);
		setReviewStats(loadedStats || { totalReviews: 0, averageRating: 0.0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } });
	}, [loadedReviews, loadedStats]);

	// visual star renderer replaced by StarRating component

	const StarBreakdown = () => {
		if (!reviewStats || reviewStats.totalReviews === 0) return null;
		return (
			<div className="bg-black/80 rounded-lg p-4 mb-6">
				<div className="flex items-center justify-between mb-4">
					<div>
						<div className="text-3xl font-bold text-yellow-100">{reviewStats.averageRating} Stars</div>
						<div className="flex items-center">
							<StarRating rating={Math.round(reviewStats.averageRating * 2) / 2} />
							<span className="ml-2 text-yellow-200">({reviewStats.totalReviews} reviews)</span>
						</div>
					</div>
				</div>

				<div className="space-y-2">
					{[5,4,3,2,1].map((stars) => (
						<div key={stars} className="flex items-center space-x-2">
							<span className="text-yellow-200 w-8">{stars}★</span>
							<div className="flex-1 bg-gray-700 rounded-full h-2">
								<div
									className="bg-yellow-400 h-2 rounded-full"
									style={{ width: `${reviewStats.totalReviews > 0 ? (reviewStats.starBreakdown[
										stars === 5 ? 'five' : stars === 4 ? 'four' : stars === 3 ? 'three' : stars === 2 ? 'two' : 'one'
									] / reviewStats.totalReviews) * 100 : 0}%` }}
								/>
							</div>
							<span className="text-yellow-200 w-8 text-sm">
								{reviewStats.starBreakdown[
									stars === 5 ? 'five' : stars === 4 ? 'four' : stars === 3 ? 'three' : stars === 2 ? 'two' : 'one'
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
				<ManageBusinessNavbar active={activeTab} onChange={setActiveTab} />
				<main className="relative z-10 pt-28 p-8 text-yellow-200">
					<div className="text-center">Loading reviews...</div>
				</main>
			</div>
		);
	}

	if (userType !== 'business' && userType !== 'businessuser' && userType !== 'business_user') {
		return (
			<div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
				<HoneycombBackground />
				<ManageBusinessNavbar active={activeTab} onChange={setActiveTab} />
				<main className="relative z-10 pt-28 p-8 text-yellow-200">
					<div className="max-w-4xl mx-auto text-center">
						<div className="bg-black/80 rounded-2xl p-8"> 
							<h2 className="text-2xl font-bold mb-4">Business Reviews</h2>
							<p className="text-yellow-200">You must be logged in as a business to view this page.</p>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
			<HoneycombBackground />
			<ManageBusinessNavbar active={activeTab} onChange={setActiveTab} />
			<main className="relative z-10 pt-28 p-8 text-yellow-200">
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

					<StarBreakdown />

					<div className="bg-black/80 rounded-2xl p-8 min-h-[300px] border border-yellow-500/20">
						{(!reviews || reviews.length === 0) ? (
							<div className="flex flex-col items-center justify-center h-64 text-center py-16">
								<div className="mb-6"><span className="text-8xl opacity-30">📝</span></div>
								<h3 className="text-3xl font-semibold text-yellow-100 mb-4">No Reviews Yet</h3>
								<p className="text-yellow-200/80 text-lg max-w-md">You haven't received any reviews yet.</p>
							</div>
						) : (
							<>
								<div className="flex items-center justify-between mb-8">
									<h3 className="text-3xl font-bold text-yellow-100">Customer Reviews ({reviews.length})</h3>
									<div className="text-yellow-300/70">Most recent first</div>
								</div>

								<div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
									{reviews.map((review, idx) => (
										<div key={review.id || idx} className="bg-black/80 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200">
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
														<p className="text-yellow-300/70">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
													</div>
												</div>

												{idx === 0 && (
													<div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">Latest</div>
												)}
											</div>

											<div className="pl-0.5"><p className="text-yellow-200 leading-relaxed text-lg">{review.reviewText}</p></div>
										</div>
									))}
								</div>
							</>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

