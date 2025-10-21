import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import HoneycombBackground from '../Components/HoneycombBackground';
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

  // flexible property getter to handle different casing/keys
  const getProp = (obj, ...names) => {
    for (const n of names) {
      if (!obj) continue;
      const v = obj[n];
      if (v !== undefined && v !== null) return v;
      const lower = obj[n.toLowerCase()];
      if (lower !== undefined && lower !== null) return lower;
      const upper = obj[n.charAt(0).toUpperCase() + n.slice(1)];
      if (upper !== undefined && upper !== null) return upper;
    }
    return undefined;
  };

  if (loading) return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
  <HoneycombBackground />
      <div className="relative z-10 p-8 text-yellow-200 flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    </div>
  );
  
  if (!card) return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <HoneycombBackground />
      <div className="relative z-10 p-8 text-yellow-200 flex items-center justify-center min-h-screen">
        <div className="text-xl">Card not found.</div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <HoneycombBackground />

      <BusinessCardNavbar
        active={activeTab}
        onChange={setActiveTab}
        slug={slug}
        businessName={getProp(card, 'businessName', 'BusinessName') || ''}
      />

      <main className="relative z-10 pt-28 p-8">
        <div className="max-w-6xl mx-auto bg-black/80 border border-yellow-300/20 rounded-lg p-8">
          <div className="md:flex md:items-start md:gap-8">
            {/* Left: main content */}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-100">
                {getProp(card, 'businessName', 'BusinessName')}
              </h1>

              <div className="mt-6 text-yellow-200 space-y-3 text-lg md:text-xl">
                <div>
                  <strong className="text-yellow-100">Category:</strong> {getProp(card, 'category', 'Category', 'businessCategory', 'BusinessCategory') || 'Uncategorized'}
                </div>
                <div>
                  <strong className="text-yellow-100">Address:</strong> {getProp(card, 'address', 'Address') || ''}
                </div>
                <div>
                  <strong className="text-yellow-100">City:</strong> {getProp(card, 'city', 'City') || ''}
                </div>
                <div>
                  <strong className="text-yellow-100">Email:</strong> {getProp(card, 'email', 'Email', 'contactEmail', 'ContactEmail') || 'N/A'}
                </div>
                <div>
                  <strong className="text-yellow-100">Phone:</strong> {formatPhone(getProp(card, 'phone', 'Phone') || '')}
                </div>
              </div>

              <div className="mt-8 text-yellow-100 text-lg md:text-xl">
                {card.description || card.Description}
              </div>

              {/* Ownership tags section */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-yellow-100">Ownership Tags</h3>
                {(() => {
                  const ot = getProp(card, 'OwnershipTags', 'ownershipTags', 'ownership_tags') || [];
                  let tagsArr = [];
                  if (Array.isArray(ot)) tagsArr = ot.map(s => String(s).trim()).filter(Boolean);
                  else if (typeof ot === 'string' && ot.trim()) tagsArr = ot.split(',').map(s => s.trim()).filter(Boolean);
                  if (tagsArr.length === 0) return <div className="mt-2 text-yellow-300">None specified</div>;
                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {tagsArr.map((t, i) => (
                        <span key={i} className="text-xs bg-gray-800 text-yellow-200 px-2 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
