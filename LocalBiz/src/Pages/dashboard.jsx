import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HoneycombBackground from '../Components/HoneycombBackground';
import StarRating from '../Components/ui/StarRating';
import { Link } from 'react-router-dom';
import { CiBookmarkPlus, CiBookmarkMinus } from 'react-icons/ci';
import { HiMapPin } from 'react-icons/hi2';

export default function Dashboard() {
  
  const backendBase = 'http://localhost:5236';

  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
  const hasSidebar = userType === 'business' || userType === 'user';

  // UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);

  // data state
  const [cards, setCards] = useState([]); 
  const [fetchedTags, setFetchedTags] = useState({}); 
  const [ratings, setRatings] = useState({}); 
  const [bookmarkedIds, setBookmarkedIds] = useState({}); 
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [primaryImages, setPrimaryImages] = useState({}); // Store primary images for each business

  // filter state
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('none'); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedOwnedTags, setSelectedOwnedTags] = useState([]);

  // ---------- Utility: flexible prop getter ----------
  const getProp = useCallback((obj, ...names) => {
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
  }, []);


  useEffect(() => {
    function onDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // ---------- Persist bookmarks to localStorage whenever they change ----------
  useEffect(() => {
    try {
      localStorage.setItem('bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      // ignore
    }
  }, [bookmarkedIds]);

  // ---------- Initial load: fetch cards, bookmarks, tags (for missing), ratings ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (localUserId) {
          try {
            const res = await fetch(`${backendBase}/api/Bookmarks/user/${encodeURIComponent(localUserId)}`);
            if (res.ok) {
              const list = await res.json();
              const map = {};
              for (const b of list) {
                const key = String(b.BusinessUserId ?? b.businessUserId);
                if (key) map[key] = true;
              }
              if (!cancelled) setBookmarkedIds(map);
            } else {
              const raw = localStorage.getItem('bookmarks');
              if (raw && !cancelled) setBookmarkedIds(JSON.parse(raw));
            }
          } catch (e) {
            const raw = localStorage.getItem('bookmarks');
            if (raw && !cancelled) setBookmarkedIds(JSON.parse(raw));
          }
        } else {
          const raw = localStorage.getItem('bookmarks');
          if (raw && !cancelled) setBookmarkedIds(JSON.parse(raw));
        }
      } finally {
        if (!cancelled) setBookmarksLoaded(true);
      }

      // 2) fetch published cards
      let published = [];
      try {
        const res = await fetch(`${backendBase}/api/ManageBusiness/cards`);
        if (res.ok) {
          const list = await res.json();
          published = Array.isArray(list) ? list.filter(c => (c.IsPublished !== undefined ? c.IsPublished : c.isPublished)) : [];
        } else {
          published = [];
        }
      } catch (e) {
        published = [];
      }
      if (cancelled) return;
      setCards(published);

      // If there are cards, fetch missing ownership tags and ratings in parallel
      if (!published || published.length === 0) return;

      const slugsToFetch = [];
      const businessIdsToFetch = new Set();
      for (const c of published) {
        const tags = getProp(c, 'OwnershipTags', 'ownershipTags') || [];
        const slug = getProp(c, 'slug', 'Slug') || '';
        if ((!tags || (Array.isArray(tags) && tags.length === 0) || (typeof tags === 'string' && !tags.trim())) && slug) {
          slugsToFetch.push(slug);
        }
        const bid = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');
        if (bid) businessIdsToFetch.add(String(bid));
      }

      // fetch tags for slugs (limit parallelism by batching)
      const fetchSlugTags = async () => {
        if (slugsToFetch.length === 0) return {};
        const promises = slugsToFetch.map(async (slug) => {
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
        const results = await Promise.allSettled(promises);
        const next = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value && r.value.slug) next[r.value.slug] = r.value.tags;
        }
        return next;
      };

      // fetch ratings
      const fetchRatings = async () => {
        const ids = Array.from(businessIdsToFetch);
        if (ids.length === 0) return {};
        const promises = ids.map(async (id) => {
          try {
            const res = await fetch(`${backendBase}/api/Reviews/stats/${id}`);
            if (!res.ok) return { businessId: id, avg: 0 };
            const data = await res.json();
            return { businessId: id, avg: Number(data?.averageRating ?? 0) };
          } catch (e) {
            return { businessId: id, avg: 0 };
          }
        });
        const results = await Promise.allSettled(promises);
        const out = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value && r.value.businessId) out[r.value.businessId] = r.value.avg;
        }
        return out;
      };

      // fetch primary images
      const fetchPrimaryImages = async () => {
        const businessIds = Array.from(businessIdsToFetch);
        console.log('Dashboard: Fetching primary images for business IDs:', businessIds);
        if (businessIds.length === 0) return {};
        const promises = businessIds.map(async (businessId) => {
          try {
            const res = await fetch(`${backendBase}/api/ManageBusiness/images/${businessId}`);
            if (!res.ok) {
              console.log(`Dashboard: Failed to fetch images for business ${businessId}:`, res.status, res.statusText);
              return { businessId, primaryImage: null };
            }
            const images = await res.json();
            console.log(`Dashboard: Images for business ${businessId}:`, images.map(img => ({ isPrimary: img.isPrimary || img.IsPrimary, url: img.url || img.Url })));
            const primaryImage = Array.isArray(images) ? images.find(img => img.isPrimary || img.IsPrimary) : null;
            console.log(`Dashboard: Primary image for business ${businessId}:`, primaryImage);
            return { businessId, primaryImage: primaryImage?.url || primaryImage?.Url || null };
          } catch (e) {
            console.error(`Dashboard: Error fetching images for business ${businessId}:`, e);
            return { businessId, primaryImage: null };
          }
        });
        const results = await Promise.allSettled(promises);
        const out = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value && r.value.businessId) {
            out[r.value.businessId] = r.value.primaryImage;
          }
        }
        console.log('Dashboard: Final primary images map:', out);
        return out;
      };

      try {
        const [tagsMap, fetchedRatings, fetchedImages] = await Promise.all([fetchSlugTags(), fetchRatings(), fetchPrimaryImages()]);
        if (!cancelled) {
          if (tagsMap && Object.keys(tagsMap).length > 0) {
            setFetchedTags(prev => ({ ...prev, ...tagsMap }));
          }
          if (fetchedRatings && Object.keys(fetchedRatings).length > 0) {
            setRatings(prev => ({ ...prev, ...fetchedRatings }));
          }
          if (fetchedImages && Object.keys(fetchedImages).length > 0) {
            console.log('Dashboard: Setting primary images in state:', fetchedImages);
            setPrimaryImages(prev => ({ ...prev, ...fetchedImages }));
          }
        }
      } catch (e) {
        // ignore per-item errors
      }
    };

    load();
    return () => { cancelled = true; };
  }, [backendBase, getProp]);

  // ---------- Derived lists memoized ----------

  // availableCategories, availableCities and availableOwnedTags are derived from cards + fetchedTags
  const { availableCategories, availableCities, availableOwnedTags } = useMemo(() => {
    const cats = new Set();
    const cities = new Set();
    const tags = new Set();
    for (const c of cards) {
      const cat = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().trim();
      if (cat) cats.add(cat);

      const city = (getProp(c, 'city', 'City') || '').toString().trim();
      if (city) cities.add(city);

      let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags') || [];
      const slug = getProp(c, 'slug', 'Slug');
      if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && slug && fetchedTags[slug]) {
        tagsRaw = fetchedTags[slug];
      }
      let arr = [];
      if (Array.isArray(tagsRaw)) arr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
      else if (typeof tagsRaw === 'string' && tagsRaw.trim()) arr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
      for (const t of arr) tags.add(t);
    }

    const defaultTags = ['Black-Owned', 'Asian-Owned', 'LGBTQ+ Owned', 'Women-Owned', 'Latin-Owned'];
    const merged = Array.from(new Set([...defaultTags, ...Array.from(tags)])).sort();
    return { 
      availableCategories: Array.from(cats).sort(), 
      availableCities: Array.from(cities).sort(),
      availableOwnedTags: merged 
    };
  }, [cards, fetchedTags, getProp]);

  // combined filtered+sorted cards
  const displayCards = useMemo(() => {
    let list = Array.isArray(cards) ? [...cards] : [];

    // search
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

    // category
    if (selectedCategory) {
      list = list.filter(c => {
        const cat = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || '').toString().trim();
        return cat === selectedCategory;
      });
    }

    // city
    if (selectedCity) {
      list = list.filter(c => {
        const city = (getProp(c, 'city', 'City') || '').toString().trim();
        return city === selectedCity;
      });
    }

    // owned tags (match any selected)
    if (selectedOwnedTags && selectedOwnedTags.length > 0) {
      list = list.filter(c => {
        let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags') || [];
        const slug = getProp(c, 'slug', 'Slug');
        if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && slug && fetchedTags[slug]) {
          tagsRaw = fetchedTags[slug];
        }
        let arr = [];
        if (Array.isArray(tagsRaw)) arr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
        else if (typeof tagsRaw === 'string' && tagsRaw.trim()) arr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);

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
  }, [cards, search, selectedCategory, selectedCity, selectedOwnedTags, sortOption, fetchedTags, ratings, getProp]);

  // ---------- Handlers: stable via useCallback ----------

  const toggleBookmarkLocalAndRemote = useCallback(async (idStr, numericId) => {
    // optimistic update
    setBookmarkedIds(prev => {
      const next = { ...prev };
      if (next[idStr]) delete next[idStr];
      else next[idStr] = true;
      return next;
    });

    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const payload = { UserId: userId ? Number(userId) : null, BusinessUserId: Number(numericId) };
      const res = await fetch(`${backendBase}/api/Bookmarks/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        // revert on failure
        setBookmarkedIds(prev => {
          const next = { ...prev };
          if (next[idStr]) delete next[idStr];
          else next[idStr] = true;
          return next;
        });
      }
    } catch (err) {
      // revert on network error
      setBookmarkedIds(prev => {
        const next = { ...prev };
        if (next[idStr]) delete next[idStr];
        else next[idStr] = true;
        return next;
      });
    }
  }, [backendBase]);

  const toggleTagSelection = useCallback((tag) => {
    setSelectedOwnedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const resetFilters = useCallback(() => {
    setSortOption('none');
    setSelectedCategory('');
    setSelectedCity('');
    setSelectedOwnedTags([]);
    setSearch('');
  }, []);

  // ---------- Render ----------
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

                <button
                  type="button"
                  onClick={() => setBookmarksOnly(v => !v)}
                  className={`ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-400 text-black font-semibold transform transition-all duration-150 hover:brightness-90 ${bookmarksOnly ? 'scale-95 shadow-lg' : ''}`}
                >
                  <span className="select-none">Bookmarks</span>
                  <svg className={`w-4 h-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-5 7 5V5z"/></svg>
                </button>

                {filterOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-[#050505] text-yellow-100 rounded-md shadow-lg z-40 overflow-hidden transition-all duration-150 ease-out transform origin-top border border-yellow-400">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">Filters & Sorting</h3>
                        <button className="text-xs text-yellow-300 hover:underline" onClick={resetFilters}>Reset</button>
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

                      <div className="mb-3">
                        <div className="text-xs text-yellow-300 font-medium mb-1">City</div>
                        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full bg-black/20 border border-yellow-300 text-yellow-100 rounded-md py-2 px-2 text-sm">
                          <option value="">All cities</option>
                          {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>

                      <div className="mb-1">
                        <div className="text-xs text-yellow-300 font-medium mb-1">Ownership Tags</div>
                        <div className="flex flex-wrap gap-2">
                          {availableOwnedTags.length === 0 && <div className="text-xs text-yellow-500">No tags</div>}
                          {availableOwnedTags.map(tag => {
                            const selected = selectedOwnedTags.includes(tag);
                            return (
                              <button key={tag} onClick={() => toggleTagSelection(tag)} className={`text-xs px-2 py-1 rounded-full ${selected ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-yellow-200'}`}>{tag}</button>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {(bookmarksOnly ? displayCards.filter(dc => {
                  const id = getProp(dc, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id') || getProp(dc, 'slug', 'Slug');
                  return id && bookmarkedIds[String(id)];
                }) : displayCards).map(c => {
                  // Debug: Log current primaryImages state (only once per render)
                  if (displayCards.indexOf(c) === 0) {
                    console.log('Dashboard: Current primaryImages state:', primaryImages);
                    console.log('Dashboard: Number of cards to render:', displayCards.length);
                  }
                  
                  const businessIdFromCard = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');

                  const name = getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || 'Untitled';
                  
                  // Debug: Check if we have a primary image for this business
                  if (businessIdFromCard) {
                    console.log(`Dashboard: Business "${name}" (ID: ${businessIdFromCard}) - Has primary image:`, !!primaryImages[businessIdFromCard], 'Image URL:', primaryImages[businessIdFromCard]);
                  }
                  const category = (getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || 'Uncategorized').toString().trim();
                  const city = getProp(c, 'city', 'City') || '';
                  const address = getProp(c, 'address', 'Address', 'streetAddress', 'StreetAddress', 'addressLine1', 'AddressLine1') || '';
                  const desc = getProp(c, 'description', 'Description') || '';
                  const slug = getProp(c, 'slug', 'Slug') || '';

                  // bookmark button logic (prefers numeric businessUserId)
                  const numericId = businessIdFromCard ?? getProp(c, 'id', 'Id');
                  const bidNum = numericId ? Number(numericId) : NaN;
                  const showBookmark = Number.isFinite(bidNum);
                  const idStr = String(bidNum);
                  const isBookmarked = Boolean(bookmarkedIds[idStr]);

                  return (
                    <Link key={businessIdFromCard || getProp(c, 'id', 'Id') || name + slug} to={`/cards/${encodeURIComponent(slug)}`} className="relative block bg-black/80 border border-yellow-300/20 rounded-lg px-3 py-6 hover:scale-[1.01] transition h-fit">
                      {/* Bookmark button */}
                      {showBookmark && (
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleBookmarkLocalAndRemote(idStr, bidNum);
                          }}
                          className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-black/60 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black transition"
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          {isBookmarked ? <CiBookmarkMinus className="w-5 h-5" /> : <CiBookmarkPlus className="w-5 h-5" />}
                        </button>
                      )}

                      {/* Top-right tags */}
                      {(() => {
                        let tagsRaw = getProp(c, 'OwnershipTags', 'ownershipTags') || [];
                        const slugKey = getProp(c, 'slug', 'Slug');
                        if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && slugKey && fetchedTags[slugKey]) {
                          tagsRaw = fetchedTags[slugKey];
                        }
                        let tagsArr = [];
                        if (Array.isArray(tagsRaw)) tagsArr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
                        else if (typeof tagsRaw === 'string' && tagsRaw.trim()) tagsArr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
                        return (
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                            <span className="text-xs bg-yellow-900 text-yellow-200 px-1.5 py-1 rounded-full">{category}</span>
                            {tagsArr.length > 0 && tagsArr.map((t, i) => (
                              <span key={i} className="text-xs bg-gray-800 text-yellow-200 px-1.5 py-1 rounded-full">{t}</span>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="flex-1 flex flex-col">
                        <div>
                          {/* Primary Image Thumbnail */}
                          {primaryImages[businessIdFromCard] && (
                            <div className="mb-3 w-full aspect-video bg-gray-800 rounded-lg border border-yellow-300/30 overflow-hidden">
                              <img 
                                src={primaryImages[businessIdFromCard].startsWith('http') ? primaryImages[businessIdFromCard] : `${backendBase}${primaryImages[businessIdFromCard]}`}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error(`Dashboard: Failed to load image for ${name}:`, e.target.src);
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <h2 className="text-xl font-bold text-yellow-50 mt-0">{name}</h2>

                          <div className="mt-0 flex items-center gap-1">
                            {(() => {
                              const businessId = businessIdFromCard;
                              const fetched = businessId ? ratings[businessId] : undefined;
                              const fallback = getProp(c, 'averageRating', 'AverageRating', 'avgRating', 'rating', 'Rating') || 0;
                              const raw = (fetched !== undefined && fetched !== null) ? fetched : fallback;
                              const ratingNum = typeof raw === 'number' ? raw : Number(raw || 0);
                              return <StarRating rating={ratingNum} />;
                            })()}
                          </div>

                          {(address || city) && (
                            <div className="text-yellow-200 text-sm mt-2 flex flex-col items-start gap-0">
                              {address ? <span className="block leading-tight flex items-center gap-1"><HiMapPin className="w-4 h-4 text-yellow-300" />{address}</span> : null}
                              {city ? <span className="block leading-tight text-yellow-200/90 mt-0.5 ml-5">{city}</span> : null}
                            </div>
                          )}
                        </div>

                        {desc && (
                          <div className="mt-auto pt-4 pr-25">
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
