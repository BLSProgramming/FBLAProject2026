import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/businessCardNavbar';
import honeycomb from '../assets/honeycomb.png';

export default function CardOffers(){
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('deals');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessUserId, setBusinessUserId] = useState(null);

  useEffect(() => {
    const fetchBusinessAndOffers = async () => {
      try {
        // Get business info from slug
        const businessResponse = await fetch(`http://localhost:5236/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
        
        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          setBusinessUserId(businessData.id);
          
          // Then fetch offers for this business
          const offersResponse = await fetch(`http://localhost:5236/api/Offers/business/${businessData.id}`);
          
          if (offersResponse.ok) {
            const offersData = await offersResponse.json();
            
            // Only show active offers that haven't expired
            const activeOffers = offersData.filter(offer => 
              offer.isActive && new Date(offer.expirationDate) >= new Date()
            );
            setOffers(activeOffers);
          }
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBusinessAndOffers();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
  <img src={honeycomb} alt="Honeycomb" className="fixed inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
      <BusinessCardNavbar active={activeTab} onChange={setActiveTab} slug={slug} />
      <main className="relative z-10 pt-28 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section with centered black card behind it (text inside the card) */}
          <div className="mb-8 mt-4 relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 z-0 w-full max-w-3xl">
              <div className="bg-black/80 rounded-3xl px-8 py-6 shadow-2xl mx-auto">
                <div className="text-center">
                  <h2 className="text-3xl text-yellow-100 font-bold mb-2">Deals and Specials</h2>
                  <p className="text-yellow-200/80 text-lg">Current promotions and limited-time offers</p>
                </div>
              </div>
            </div>
            <div className="h-28" />
          </div>
          
          {loading ? (
            <div className="text-yellow-200 text-center text-xl">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="bg-black/80 border border-yellow-300/20 rounded-lg p-8 text-center">
              <p className="text-yellow-200 text-xl">No active deals available at this time.</p>
              <p className="text-yellow-300 mt-2">Check back soon for new offers!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-black/80 border border-yellow-300/20 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-yellow-100 font-bold text-2xl">{offer.label}</h3>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  </div>
                  <p className="text-yellow-200 text-lg mb-4">{offer.description}</p>
                  <div className="flex justify-between items-center">
                    {offer.promoCode && (
                      <div className="bg-yellow-400 text-black px-4 py-2 rounded-lg">
                        <span className="font-bold">Promo Code: {offer.promoCode}</span>
                      </div>
                    )}
                    <p className="text-yellow-300">
                      Expires: {formatDate(offer.expirationDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
