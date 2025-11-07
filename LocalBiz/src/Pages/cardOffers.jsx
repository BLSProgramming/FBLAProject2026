import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/BusinessCardNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import { logger } from '../utils/helpers';
import { businessAPI } from '../utils/api';
import { 
  HiSparkles, 
  HiCalendar, 
  HiClipboard, 
  HiExclamationCircle,
  HiTag,
  HiClock,
  HiGift,
  HiCheck
} from 'react-icons/hi2';

export default function CardOffers(){
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('deals');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessUserId, setBusinessUserId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const fetchBusinessAndOffers = async () => {
      try {
        // Get business info from slug
        const businessData = await businessAPI.getCard(slug);
        setBusinessUserId(businessData.id);
        setBusinessName(businessData.businessName);
        
        // Then fetch offers for this business
        const offersData = await businessAPI.getOffers(businessData.id);
        
        // Only show active offers that haven't expired
        const activeOffers = offersData.filter(offer => 
          offer.isActive && new Date(offer.expirationDate) >= new Date()
        );
        setOffers(activeOffers);
      } catch (error) {
        logger.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusinessAndOffers();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    const datePart = dateString.split('T')[0]; 
    const [year, month, day] = datePart.split('-');
    return `${month}/${day}/${year}`;
  };

  const copyPromoCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      logger.error('Failed to copy promo code:', err);
    }
  };

  const getDaysUntilExpiry = (expirationDate) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOfferTypeIcon = (offer) => {
    if (offer.promoCode) return <HiTag className="w-6 h-6" />;
    return <HiGift className="w-6 h-6" />;
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background layer that covers full viewport */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-black z-0"></div>
      <HoneycombBackground opacity={0.12} />
      <BusinessCardNavbar active={activeTab} onChange={setActiveTab} slug={slug} />
      <PageTransition>
        <main className="relative z-10 pt-28 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-12 mt-4 relative">
            <div className="bg-gradient-to-r from-black/90 via-black/95 to-black/90 rounded-3xl px-8 py-8 shadow-2xl border border-yellow-300/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <HiSparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                  <h2 className="text-4xl text-yellow-100 font-bold">Deals & Specials</h2>
                  <HiSparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
                <p className="text-yellow-200 text-lg mb-2">
                  {businessName ? `Exclusive offers from ${businessName}` : 'Current promotions and limited-time offers'}
                </p>
                <div className="flex items-center justify-center gap-2 text-yellow-300">
                  <HiClock className="w-4 h-4" />
                  <span className="text-sm">Limited time offers - Don't miss out!</span>
                </div>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="bg-black/90 rounded-2xl p-8 border border-yellow-300/20">
                <div className="flex items-center gap-3 text-yellow-200 text-xl">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading exclusive offers...
                </div>
              </div>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-gradient-to-br from-black/90 to-gray-900/90 border border-yellow-300/20 rounded-2xl p-12 text-center shadow-2xl">
              <HiExclamationCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-yellow-100 mb-2">No Active Deals</h3>
              <p className="text-yellow-200 text-lg mb-4">No promotions are currently available.</p>
              <div className="bg-yellow-400/10 rounded-xl p-4 border border-yellow-400/20">
                <p className="text-yellow-300 font-medium">🔔 Check back soon for new exclusive offers!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-8">
              {offers.map((offer, index) => {
                const daysLeft = getDaysUntilExpiry(offer.expirationDate);
                const isExpiringSoon = daysLeft <= 3;
                
                return (
                  <div 
                    key={offer.id} 
                    className="group bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 border border-yellow-300/20 rounded-2xl p-8 shadow-2xl hover:shadow-yellow-400/10 transition-all duration-300 hover:scale-[1.02] hover:border-yellow-300/40"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-yellow-400/20 p-3 rounded-xl border border-yellow-400/30">
                          {getOfferTypeIcon(offer)}
                        </div>
                        <div>
                          <h3 className="text-yellow-100 font-bold text-2xl mb-2 group-hover:text-yellow-50 transition-colors">
                            {offer.label}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold border border-green-500/30">
                              🟢 Active Deal
                            </span>
                            {isExpiringSoon && (
                              <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-semibold border border-red-500/30 animate-pulse">
                                ⚠️ Ending Soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-yellow-400/5 rounded-xl p-4 mb-6 border border-yellow-400/10">
                      <p className="text-yellow-200 text-lg leading-relaxed">{offer.description}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Promo Code Section */}
                      {offer.promoCode ? (
                        <button
                          onClick={() => copyPromoCode(offer.promoCode)}
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-3 cursor-pointer"
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium opacity-80">Promo Code:</span>
                            <span className="text-lg font-bold">{offer.promoCode}</span>
                          </div>
                          <div className="ml-auto">
                            {copiedCode === offer.promoCode ? (
                              <HiCheck className="w-5 h-5 text-green-700" />
                            ) : (
                              <HiClipboard className="w-5 h-5 opacity-70" />
                            )}
                          </div>
                        </button>
                      ) : (
                        <div className="bg-purple-500/20 text-purple-300 px-6 py-3 rounded-xl border border-purple-500/30 font-semibold">
                          🎁 No Code Required
                        </div>
                      )}

                      {/* Expiration Info */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-yellow-300 mb-1">
                          <HiCalendar className="w-4 h-4" />
                          <span className="font-medium">Expires: {formatDate(offer.expirationDate)}</span>
                        </div>
                        <p className={`text-sm font-medium ${
                          isExpiringSoon ? 'text-red-300' : 'text-yellow-400'
                        }`}>
                          {daysLeft === 0 ? 'Expires today!' : 
                           daysLeft === 1 ? '1 day left' : 
                           `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </main>
      </PageTransition>
    </div>
  );
}
