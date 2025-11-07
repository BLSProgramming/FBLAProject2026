import React, { useState, useEffect } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import { useNavbar } from '../contexts/NavbarContext';

export default function ManageOffers() {
  const { isNavbarOpen } = useNavbar();
  const [label, setLabel] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [activeTab, setActiveTab] = useState('manageOffers');

  // Fetch offers on component mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`http://localhost:5236/api/Offers/business/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setStatusMessage('User not logged in');
        return;
      }

      const offerData = {
        businessUserId: parseInt(userId),
        label,
        description: offerDescription,
        expirationDate: expirationDate + 'T23:59:59', // Set to end of day to avoid timezone issues
        promoCode: promoCode || null
      };

      console.log('Sending offer data:', offerData);

      const response = await fetch('http://localhost:5236/api/Offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        setStatusMessage('Offer saved successfully!');
        
        // Clear form after successful save
        setLabel('');
        setOfferDescription('');
        setExpirationDate('');
        setPromoCode('');
        
        // Refresh offers list
        fetchOffers();
      } else {
        setStatusMessage('Error saving offer. Please try again.');
      }
    } catch (error) {
      setStatusMessage('Error saving offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOfferStatus = async (offerId, currentStatus) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5236/api/Offers/${offerId}/toggle?businessUserId=${userId}`, {
        method: 'PUT'
      });

      if (response.ok) {
        fetchOffers(); // Refresh the offers list
      }
    } catch (error) {
      console.error('Error toggling offer status:', error);
    }
  };

  const deleteOffer = async (offerId) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5236/api/Offers/${offerId}?businessUserId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchOffers(); // Refresh the offers list
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
    }
  };

  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date();
  };

  // Helper function to format date without timezone issues
  const formatDateForDisplay = (dateString) => {
    // Extract just the date part before any time or timezone info
    const datePart = dateString.split('T')[0]; // Gets "2025-11-30" from "2025-11-30T23:59:59"
    const [year, month, day] = datePart.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
    <>
      {/* Management Navbar - Fixed outside main content */}
      <ManageBusinessNavbar active={activeTab} onChange={setActiveTab} isNavbarOpen={isNavbarOpen} />
      
      {/* Main Content Area */}
      <div className="relative min-h-screen w-full">
        {/* Background layer that covers full viewport */}
        <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-black z-0"></div>
        <HoneycombBackground opacity={0.12} />
      
      <PageTransition>
        <main className="relative z-10 pt-24 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-yellow-100 text-center mb-8">
            <span className="inline-block bg-black px-4 py-2 rounded-md border border-yellow-700/20">Manage Offers</span>
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Offers Display */}
            <div className="bg-black/90 border border-yellow-300/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-100 mb-6">Current Offers</h2>
              
              {loadingOffers ? (
                <div className="text-yellow-200 text-center py-8">Loading offers...</div>
              ) : offers.length === 0 ? (
                <div className="text-yellow-200 text-center py-8">No offers created yet</div>
              ) : (
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {offers.map((offer) => (
                    <div key={offer.id} className="bg-gray-900/50 border border-yellow-300/20 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-yellow-100 font-semibold text-lg">{offer.label}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            !offer.isActive ? 'bg-red-600 text-white' : 
                            isExpired(offer.expirationDate) ? 'bg-orange-600 text-white' : 
                            'bg-green-600 text-white'
                          }`}>
                            {!offer.isActive ? 'Inactive' : isExpired(offer.expirationDate) ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-yellow-200 mb-3">{offer.description}</p>
                      
                      <div className="text-sm text-yellow-300 space-y-1">
                        <div>Expires: {formatDateForDisplay(offer.expirationDate)}</div>
                        {offer.promoCode && <div>Promo Code: <span className="font-mono bg-gray-800 px-1 rounded">{offer.promoCode}</span></div>}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => toggleOfferStatus(offer.id, offer.isActive)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            offer.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          } text-white transition-colors`}
                        >
                          {offer.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Offer Form */}
            <div className="bg-black/90 border border-yellow-300/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-100 mb-6">Add New Offer</h2>
          
              <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-yellow-100 font-semibold mb-2">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-yellow-100 border border-yellow-300/30 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Enter offer label"
                required
              />
            </div>

            <div>
              <label className="block text-yellow-100 font-semibold mb-2">
                Offer Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900 text-yellow-100 border border-yellow-300/30 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                placeholder="Describe your special offer"
                required
              />
            </div>

            <div>
              <label className="block text-yellow-100 font-semibold mb-2">
                Expiration Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-yellow-100 border border-yellow-300/30 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            <div>
              <label className="block text-yellow-100 font-semibold mb-2">
                Promo Code
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 text-yellow-100 border border-yellow-300/30 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Optional promo code"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-400 text-black font-bold rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Offer'}
              </button>
            </div>

            {statusMessage && (
              <div className={`text-center font-semibold ${statusMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {statusMessage}
              </div>
            )}
              </form>

              {/* Quick Actions */}
              <div className="border-t border-yellow-300/20 pt-6">
                <h3 className="text-xl font-bold text-yellow-100 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={fetchOffers}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                  >
                    Refresh Offers List
                  </button>
                  
                  <div className="text-yellow-200 text-sm">
                    <p>• Use the buttons in the offers list to activate/deactivate or delete individual offers</p>
                    <p>• Expired offers are marked in orange but remain visible until deleted</p>
                    <p>• Inactive offers won't be shown to customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </main>
      </PageTransition>
      </div>
    </>
  );
}