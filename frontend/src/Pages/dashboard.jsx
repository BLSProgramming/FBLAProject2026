import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PageShell from '../Components/PageShell';
import StarRating from '../Components/ui/StarRating';
import { Link } from 'react-router-dom';
import { CiBookmarkPlus, CiBookmarkMinus } from 'react-icons/ci';
import { HiMapPin } from 'react-icons/hi2';
import { useNavbar } from '../contexts/NavbarContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, OWNERSHIP_TAGS } from '../utils/constants';
import { getProp, parseOwnershipTags, logger } from '../utils/helpers';

export default function Dashboard() {
  
  const backendBase = API_BASE_URL;

  const { user } = useAuth();
  const userType = user?.userType ?? null;
  const userId = user?.userId ?? null;
  const authToken = user?.token ?? null;
  const hasSidebar = userType === 'business' || userType === 'user';
  const { isNavbarOpen } = useNavbar();

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
  // Now imported from helpers.js


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
        const localUserId = userId;
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

      // 2) fetch published cards (now includes averageRating + primaryImageUrl from API)
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

      if (!published || published.length === 0) return;

      // Extract ratings and images from the enriched card data (no N+1 fetches needed)
      const ratingsMap = {};
      const imagesMap = {};
      for (const c of published) {
        const bid = String(getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id'));
        if (bid) {
          const avg = getProp(c, 'averageRating', 'AverageRating');
          if (avg !== undefined && avg !== null) ratingsMap[bid] = Number(avg);
          const imgUrl = getProp(c, 'primaryImageUrl', 'PrimaryImageUrl');
          if (imgUrl) imagesMap[bid] = imgUrl;
        }
      }
      if (!cancelled) {
        if (Object.keys(ratingsMap).length > 0) setRatings(ratingsMap);
        if (Object.keys(imagesMap).length > 0) setPrimaryImages(imagesMap);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [backendBase]);

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

    const defaultTags = OWNERSHIP_TAGS;
    const merged = Array.from(new Set([...defaultTags, ...Array.from(tags)])).sort();
    return { 
      availableCategories: Array.from(cats).sort(), 
      availableCities: Array.from(cities).sort(),
      availableOwnedTags: merged 
    };
  }, [cards, fetchedTags]);

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
      const payload = { UserId: userId ? Number(userId) : null, BusinessUserId: Number(numericId) };
      const res = await fetch(`${backendBase}/api/Bookmarks/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
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
    <>
      {/* Dashboard Top Navbar - Fixed outside main content */}
      <div className="fixed top-0 left-0 right-0 bg-[#050505] border-b border-yellow-400 shadow-sm z-30">
        <div className="w-full mx-auto max-w-none px-16 py-4 flex flex-col items-center gap-4">
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
      </div>

      {/* Main Content Area */}
      <PageShell>
          <div className="relative z-10 pt-32 p-0 min-h-screen w-full flex flex-col items-center">
            <main className="w-full">
              <div className="w-full mx-auto max-w-none px-16 py-8">
                <div className="mt-12">
              {cards.length === 0 && <div className="text-yellow-200">No published cards yet.</div>}
              {cards.length > 0 && displayCards.length === 0 && (
                <div className="text-yellow-200">No results match your search.</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {(bookmarksOnly ? displayCards.filter(dc => {
                  const id = getProp(dc, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id') || getProp(dc, 'slug', 'Slug');
                  return id && bookmarkedIds[String(id)];
                }) : displayCards).map(c => {
                  const businessIdFromCard = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');

                  const name = getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || 'Untitled';
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
                    <Link key={businessIdFromCard || getProp(c, 'id', 'Id') || name + slug} to={`/cards/${encodeURIComponent(slug)}`} className="relative block bg-black/80 border border-yellow-300/20 rounded-lg px-3 py-4 hover:scale-[1.02] hover:shadow-xl hover:border-yellow-300/40 transition-all duration-300 h-fit">
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
                        const tagsArr = parseOwnershipTags(tagsRaw);
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
                          {primaryImages[businessIdFromCard] ? (
                            <div className="mb-3 w-full aspect-[4/3] bg-gray-800 rounded-lg border border-yellow-300/30 overflow-hidden shadow-lg">
                              <img 
                                src={primaryImages[businessIdFromCard].startsWith('http') ? primaryImages[businessIdFromCard] : `${backendBase}${primaryImages[businessIdFromCard]}`}
                                alt={name}
                                className="w-full h-full object-cover transition-opacity duration-300"
                                loading="lazy"
                                onError={(e) => {
                                  // Hide the broken image and show the fallback via sibling
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              {/* Hidden fallback shown on error */}
                              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 items-center justify-center hidden">
                                <div className="text-center text-yellow-300/60">
                                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  <p className="text-sm">Image unavailable</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3 w-full aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-yellow-300/30 overflow-hidden shadow-lg flex items-center justify-center">
                              <div className="text-center text-yellow-300/60">
                                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                <p className="text-sm">No image</p>
                              </div>
                            </div>
                          )}
                          
                          <h2 className="text-lg font-bold text-yellow-50 mt-0 mb-1">{name}</h2>

                          <div className="mt-1 flex items-center gap-1">
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
                              {address ? <span className="block leading-tight flex items-center gap-1"><HiMapPin className="w-4 h-4 text-yellow-300 flex-shrink-0" />{address}</span> : null}
                              {city ? <span className="block leading-tight text-yellow-200/90 mt-0.5 ml-5">{city}</span> : null}
                            </div>
                          )}
                        </div>

                        {desc && (
                          <div className="mt-auto pt-3 pr-10">
                            <p className="text-yellow-200/90 text-sm line-clamp-3 break-words leading-relaxed">{desc}</p>
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
      </PageShell>
    </>
  );
}
