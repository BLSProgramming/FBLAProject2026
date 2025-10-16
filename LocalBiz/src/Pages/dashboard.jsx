import { useState, useEffect, useRef } from 'react';
import honeycomb from '../Assets/honeycomb.png';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
  const hasSidebar = userType === 'business' || userType === 'user';

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [cards, setCards] = useState([]);
  const [ratings, setRatings] = useState({});
  const filterOptions = [
    { id: 'option1', label: 'Placeholder option 1' },
    { id: 'option2', label: 'Placeholder option 2' },
    { id: 'option3', label: 'Placeholder option 3' },
  ];

  useEffect(() => {
    function onDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    // fetch published cards for the dashboard
    fetch('http://localhost:5236/api/ManageBusiness/cards')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setCards)
      .catch(() => setCards([]));
  }, []);

  // Helper to get properties with flexible casing from card objects
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

  // client-side filtered list based on search input
  const filteredCards = (function() {
    if (!search || !search.trim()) return cards;
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      const name = (getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || '').toString().toLowerCase();
      const category = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().toLowerCase();
      const city = (getProp(c, 'city', 'City') || '').toString().toLowerCase();
      const desc = (getProp(c, 'description', 'Description') || '').toString().toLowerCase();
      const slug = (getProp(c, 'slug', 'Slug') || '').toString().toLowerCase();
      return name.includes(q) || category.includes(q) || city.includes(q) || desc.includes(q) || slug.includes(q);
    });
  })();

  // When cards load, fetch review stats for each card's business id to show average rating
  useEffect(() => {
    if (!cards || cards.length === 0) return;

    const fetchAll = async () => {
      const promises = cards.map(async (c) => {
        const businessId = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');
        if (!businessId) return null;
        try {
          const res = await fetch(`http://localhost:5236/api/Reviews/stats/${businessId}`);
          if (!res.ok) return { businessId, avg: 0 };
          const data = await res.json();
          return { businessId, avg: Number(data?.averageRating ?? 0) };
        } catch (e) {
          return { businessId, avg: 0 };
        }
      });

      const results = await Promise.allSettled(promises);
      const next = {};
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value && r.value.businessId) {
          next[r.value.businessId] = r.value.avg;
        }
      }
      setRatings(next);
    };

    fetchAll();
  }, [cards]);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />

      <div className="relative z-10 p-0 min-h-screen w-full flex flex-col items-center">
        
        <div
          className={`fixed top-0 right-0 bg-[#050505] border-b border-yellow-400 shadow-sm z-30 ${hasSidebar ? 'left-64' : 'left-0'}`}
        >
          <div className={`w-full mx-auto max-w-none px-16 py-4 flex flex-col items-center gap-4`}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400">Biz-Buzz Dashboard</h1>

            <div className="w-full sm:w-1/2 flex items-center gap-3">
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 rounded-md border border-yellow-300 bg-black/20 text-yellow-100 placeholder-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen(v => !v)}
                  className={`ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-400 text-black font-semibold transform transition-all duration-150 ${filterOpen ? 'scale-95 shadow-lg' : 'hover:brightness-90'}`}
                >
                  <span className="select-none">Filter</span>
                  <svg className={`w-4 h-4 transform transition-transform duration-150 ${filterOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>

                {filterOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white text-black rounded-md shadow-lg z-40 overflow-hidden transition-all duration-150 ease-out transform origin-top">
                    {/* animate in: start slightly up and transparent, then slide/opacity in */}
                    <div className="animate-in opacity-100 translate-y-0">
                    <ul className="divide-y">
                      {filterOptions.map(opt => {
                        const checked = selectedFilters.includes(opt.id);
                        return (
                          <li
                            key={opt.id}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 first:rounded-t-md last:rounded-b-md"
                            onClick={() => {
                              
                              setSelectedFilters(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id]);
                            }}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={checked}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedFilters(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id]);
                              }}
                              aria-label={opt.label}
                            />
                            <span className="text-sm">{opt.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-20" />

        <main className="w-full">
          <div className="w-full mx-auto max-w-none px-16 py-8">
            <div className="mt-12">
              {cards.length === 0 && <div className="text-yellow-200">No published cards yet.</div>}
              {cards.length > 0 && filteredCards.length === 0 && (
                <div className="text-yellow-200">No results match your search.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map(c => {
                  const businessIdFromCard = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');

                  const name = getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || 'Untitled';
                  const category = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || 'Uncategorized').toString().trim();
                  const city = getProp(c, 'city', 'City') || '';
                  const desc = getProp(c, 'description', 'Description') || '';
                  const slug = getProp(c, 'slug', 'Slug') || '';

                  return (
                    <Link key={businessIdFromCard || getProp(c, 'id', 'Id') || name + slug} to={`/cards/${encodeURIComponent(slug)}`} className="block bg-black/80 border border-yellow-300/20 rounded-lg p-4 hover:scale-[1.01] transition">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-xl font-semibold text-yellow-100">{name}</h3>
                        <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full">{category}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {(() => {
                          // Prefer rating fetched from reviews/stats by business id
                          const businessId = businessIdFromCard;
                          const fetched = businessId ? ratings[businessId] : undefined;
                          const fallback = getProp(c, 'averageRating', 'AverageRating', 'avgRating', 'rating', 'Rating') || 0;
                          const raw = (fetched !== undefined && fetched !== null) ? fetched : fallback;
                          const ratingNum = typeof raw === 'number' ? raw : Number(raw || 0);
                          const ratingRounded = Math.max(0, Math.min(5, Math.round(ratingNum)));
                          return [1,2,3,4,5].map(i => (
                            <span key={i} className={`text-2xl ${i <= ratingRounded ? 'text-yellow-300' : 'text-gray-400'}`}>★</span>
                          ));
                        })()}
                      </div>
                      {city && <p className="text-yellow-200 text-sm mt-2">{city}</p>}
                      {desc && <p className="text-yellow-200 text-sm mt-1 line-clamp-3">{desc}</p>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
