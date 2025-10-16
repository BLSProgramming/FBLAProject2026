import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import honeycomb from '../assets/honeycomb.png';
import BusinessCardNavbar from '../Components/businessCardNavbar';

export default function CardPage() {
  const { slug } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`http://localhost:5236/api/ManageBusiness/slug/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setCard(data))
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatPhone = (raw) => {
    if (!raw && raw !== 0) return '';
    const s = String(raw).replace(/[^0-9]/g, '');
    if (s.length === 10) {
      return `(${s.slice(0,3)}) ${s.slice(3,6)}-${s.slice(6)}`;
    }
    if (s.length === 11 && s.startsWith('1')) {
      return `(${s.slice(1,4)}) ${s.slice(4,7)}-${s.slice(7)}`;
    }
    return raw;
  }

  if (loading) return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
      <div className="relative z-10 p-8 text-yellow-200 flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    </div>
  );
  
  if (!card) return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
      <div className="relative z-10 p-8 text-yellow-200 flex items-center justify-center min-h-screen">
        <div className="text-xl">Card not found.</div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />

      <BusinessCardNavbar
        active={activeTab}
        onChange={setActiveTab}
        slug={slug}
        businessName={(card && (card.businessName || card.BusinessName)) || ''}
      />

      <main className="relative z-10 pt-28 p-8">
        <div className="max-w-6xl mx-auto bg-black/80 border border-yellow-300/20 rounded-lg p-8">
          <div className="md:flex md:items-start md:gap-8">
            {/* Left: main content */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-100">
                {card.businessName || card.BusinessName}
              </h1>

              <div className="mt-6 text-yellow-200 space-y-3 text-lg md:text-xl">
                <div>
                  <strong className="text-yellow-100">Category:</strong> {card.category || card.Category}
                </div>
                <div>
                  <strong className="text-yellow-100">Address:</strong> {card.address || card.Address}
                </div>
                <div>
                  <strong className="text-yellow-100">City:</strong> {card.city || card.City}
                </div>
                <div>
                  <strong className="text-yellow-100">Email:</strong> {card.email || card.Email}
                </div>
                <div>
                  <strong className="text-yellow-100">Phone:</strong> {formatPhone(card.phone || card.Phone)}
                </div>
              </div>

              <div className="mt-8 text-yellow-100 text-lg md:text-xl">
                {card.description || card.Description}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
