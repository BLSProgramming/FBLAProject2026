import { useState, useEffect, useRef } from 'react';
import HoneycombBackground from '../Components/HoneycombBackground';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
  const hasSidebar = userType === 'business' || userType === 'user';

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [search, setSearch] = useState('');
  // advanced filter/sort state
  const [sortOption, setSortOption] = useState('none'); // 'none' | 'rating' | 'alpha'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedOwnedTags, setSelectedOwnedTags] = useState([]);
  const [availableOwnedTags, setAvailableOwnedTags] = useState([]);
  const [cards, setCards] = useState([]);
  const [ratings, setRatings] = useState({});
  const [fetchedTags, setFetchedTags] = useState({});

  useEffect(() => {
    function onDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    // fetch cards and display only those that are published
    fetch('http://localhost:5236/api/ManageBusiness/cards')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(list => {
        try {
          const published = Array.isArray(list) ? list.filter(c => (c.IsPublished !== undefined ? c.IsPublished : c.isPublished)) : [];
          setCards(published);
        } catch (e) {
          setCards([]);
        }
      })
      .catch(() => setCards([]));
  }, []);

  // When cards are loaded, fetch full-card info for any card missing OwnershipTags so tags display
  useEffect(() => {
    if (!cards || cards.length === 0) return;
    const backendBase = 'http://localhost:5236';
    const toFetch = [];
    for (const c of cards) {
      const tags = getProp(c, 'OwnershipTags', 'ownershipTags') || [];
      const slug = getProp(c, 'slug', 'Slug') || '';
      if ((!tags || tags.length === 0) && slug) toFetch.push(slug);
    }
    if (toFetch.length === 0) return;

    // Limit concurrent requests slightly
    const promises = toFetch.map(async (slug) => {
      try {
        const res = await fetch(`${backendBase}/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const ot = data?.OwnershipTags ?? data?.ownershipTags ?? '';
        let arr = [];
        if (Array.isArray(ot)) arr = ot.map(s => String(s).trim()).filter(Boolean);
        else if (typeof ot === 'string' && ot.trim()) arr = ot.split(',').map(s => s.trim()).filter(Boolean);
        return { slug, tags: arr };
      } catch (e) {
        return null;
      }
    });

    Promise.all(promises).then(results => {
      const next = {};
      for (const r of results) {
        if (r && r.slug) next[r.slug] = r.tags;
      }
      if (Object.keys(next).length > 0) setFetchedTags(prev => ({ ...prev, ...next }));
    });
  }, [cards]);

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
  // compute available categories and owned tags from cards + fetchedTags
  useEffect(() => {
    try {
      const cats = new Set();
      const tags = new Set();
      for (const c of cards) {
        const cat = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().trim();
        if (cat) cats.add(cat);
        let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags', 'OwnershipTags') || [];
        if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && fetchedTags[getProp(c, 'slug', 'Slug')]) {
          tagsRaw = fetchedTags[getProp(c, 'slug', 'Slug')];
        }
        let arr = [];
        if (Array.isArray(tagsRaw)) arr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
        else if (typeof tagsRaw === 'string' && tagsRaw.trim()) arr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
        for (const t of arr) tags.add(t);
      }
  setAvailableCategories(Array.from(cats).sort());
  // ensure default known ownership tags are available as filter chips (so users can filter even if no card yet has them)
  const defaultTags = ['Black-Owned', 'Asian-Owned', 'LGBTQ+ Owned', 'Women-Owned', 'Latino-Owned'];
  const merged = Array.from(new Set([...defaultTags, ...Array.from(tags)])).sort();
  setAvailableOwnedTags(merged);
    } catch (e) {
      setAvailableCategories([]);
      setAvailableOwnedTags([]);
    }
  }, [cards, fetchedTags]);

  // combined search + filter + sort pipeline
  const displayCards = (function() {
    let list = Array.isArray(cards) ? [...cards] : [];

    // search filtering
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => {
        const name = (getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || '').toString().toLowerCase();
        const category = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().toLowerCase();
        const city = (getProp(c, 'city', 'City') || '').toString().toLowerCase();
        const desc = (getProp(c, 'description', 'Description') || '').toString().toLowerCase();
        const slug = (getProp(c, 'slug', 'Slug') || '').toString().toLowerCase();
        return name.includes(q) || category.includes(q) || city.includes(q) || desc.includes(q) || slug.includes(q);
      });
    }

    // category filter
    if (selectedCategory) {
      list = list.filter(c => {
        const cat = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().trim();
        return cat === selectedCategory;
      });
    }

    // owned tags filter (if any selected, show cards that contain any selected tag)
    if (selectedOwnedTags && selectedOwnedTags.length > 0) {
      list = list.filter(c => {
        let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags', 'OwnershipTags') || [];
        if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && fetchedTags[getProp(c, 'slug', 'Slug')]) {
          tagsRaw = fetchedTags[getProp(c, 'slug', 'Slug')];
        }
        let arr = [];
        if (Array.isArray(tagsRaw)) arr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
        else if (typeof tagsRaw === 'string' && tagsRaw.trim()) arr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
        // match if any of the selected tags exist on the card
        for (const sel of selectedOwnedTags) if (arr.includes(sel)) return true;
        return false;
      });
    }

    // sorting
    if (sortOption === 'rating') {
      list.sort((a, b) => {
        const aid = getProp(a, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');
        const bid = getProp(b, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');
        const ar = (aid && ratings[aid] !== undefined) ? ratings[aid] : Number(getProp(a, 'averageRating', 'AverageRating', 'avgRating', 'rating', 'Rating') || 0);
        const br = (bid && ratings[bid] !== undefined) ? ratings[bid] : Number(getProp(b, 'averageRating', 'AverageRating', 'avgRating', 'rating', 'Rating') || 0);
        return br - ar; // desc
      });
    } else if (sortOption === 'alpha') {
      list.sort((a, b) => {
        const an = (getProp(a, 'businessName', 'BusinessName', 'name', 'Name') || '').toString().toLowerCase();
        const bn = (getProp(b, 'businessName', 'BusinessName', 'name', 'Name') || '').toString().toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });
    }

    return list;
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
  <HoneycombBackground />

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
                  <div className="absolute left-0 mt-2 w-80 bg-[#050505] text-yellow-100 rounded-md shadow-lg z-40 overflow-hidden transition-all duration-150 ease-out transform origin-top border border-yellow-400">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Filters & Sorting</h3>
                        <button className="text-xs text-yellow-300 hover:underline" onClick={() => {
                          setSortOption('none'); setSelectedCategory(''); setSelectedOwnedTags([]); setSearch('');
                        }}>Reset</button>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-yellow-300 font-medium mb-1">Sort</div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm">
                            <input type="radio" name="sort" value="none" checked={sortOption === 'none'} onChange={() => setSortOption('none')} className="mr-2" /> Default
                          </label>
                          <label className="text-sm">
                            <input type="radio" name="sort" value="rating" checked={sortOption === 'rating'} onChange={() => setSortOption('rating')} className="mr-2" /> Rating (high → low)
                          </label>
                          <label className="text-sm">
                            <input type="radio" name="sort" value="alpha" checked={sortOption === 'alpha'} onChange={() => setSortOption('alpha')} className="mr-2" /> Alphabetical
                          </label>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-yellow-300 font-medium mb-1">Category</div>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-black/20 border border-yellow-300 text-yellow-100 rounded-md py-2 px-2 text-sm">
                          <option value="">All categories</option>
                          {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div className="mb-1">
                        <div className="text-xs text-yellow-300 font-medium mb-1">Ownership Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {availableOwnedTags.length === 0 && <div className="text-xs text-yellow-500">No tags</div>}
                          {availableOwnedTags.map(tag => {
                            const selected = selectedOwnedTags.includes(tag);
                            return (
                              <button key={tag} onClick={() => {
                                setSelectedOwnedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                              }} className={`text-xs px-2 py-1 rounded-full ${selected ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-yellow-200'}`}>{tag}</button>
                            );
                          })}
                        </div>
                      </div>
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
              {cards.length > 0 && displayCards.length === 0 && (
                <div className="text-yellow-200">No results match your search.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCards.map(c => {
                  const businessIdFromCard = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');

                  const name = getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || 'Untitled';
                  const category = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || 'Uncategorized').toString().trim();
                  const city = getProp(c, 'city', 'City') || '';
                  const desc = getProp(c, 'description', 'Description') || '';
                  const slug = getProp(c, 'slug', 'Slug') || '';

                  return (
                    <Link key={businessIdFromCard || getProp(c, 'id', 'Id') || name + slug} to={`/cards/${encodeURIComponent(slug)}`} className="relative block bg-black/80 border border-yellow-300/20 rounded-lg px-3 py-6 min-h-[220px] hover:scale-[1.01] transition">
                      {/* Top-right stacked tags */}
                      {(() => {
                        let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags', 'OwnershipTags') || [];
                        if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && fetchedTags[getProp(c, 'slug', 'Slug')]) {
                          tagsRaw = fetchedTags[getProp(c, 'slug', 'Slug')];
                        }
                        // normalize to array
                        let tagsArr = [];
                        if (Array.isArray(tagsRaw)) tagsArr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
                        else if (typeof tagsRaw === 'string' && tagsRaw.trim()) tagsArr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
                        else tagsArr = [];
                        // Always show the category; render ownership tags only when present
                        return (
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                            <span className="text-xs bg-yellow-900 text-yellow-200 px-1.5 py-1 rounded-full">{category}</span>
                            {tagsArr.length > 0 && tagsArr.map((t, i) => (
                              <span key={i} className="text-xs bg-gray-800 text-yellow-200 px-1.5 py-1 rounded-full">{t}</span>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Business name */}
                          <h2 className="text-xl font-bold text-yellow-50 mt-0">{name}</h2>

                          <div className="mt-0 flex items-center gap-1">
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
                        </div>

                        {desc && (
                          // container adds right padding so the description doesn't flow under the top-right tags and sits at the bottom
                          <div className="mt-4 pr-25">
                            <p className="text-yellow-200 text-sm line-clamp-3 break-words">{desc}</p>
                          </div>
                        )}
                      </div>
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
