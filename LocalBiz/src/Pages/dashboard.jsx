import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HoneycombBackground from '../Components/HoneycombBackground';
import StarRating from '../Components/ui/StarRating';
import { Link } from 'react-router-dom';
import { CiBookmarkPlus, CiBookmarkMinus } from 'react-icons/ci';
import { HiMapPin } from 'react-icons/hi2';
import { API_BASE_URL } from '../utils/constants';
import { logger, capitalizeText } from '../utils/helpers';
import { businessAPI, userAPI } from '../utils/api';
import { useNavbar } from '../contexts/NavbarContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const userType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;
  const hasNavbar = userType === 'business' || userType === 'user';
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  // UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState({});

  // data state
  const [cards, setCards] = useState([]); 
  const [fetchedTags, setFetchedTags] = useState({}); 
  const [ratings, setRatings] = useState({}); 
  const [bookmarkedIds, setBookmarkedIds] = useState({}); 
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const [primaryImages, setPrimaryImages] = useState({}); // 

  // filter state
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('none'); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedOwnedTags, setSelectedOwnedTags] = useState([]);

  // ---------- Utility functions ----------
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

  const processOwnershipTags = useCallback((card, fetchedTags) => {
    let tagsRaw = getProp(card, 'OwnershipTags', 'ownershipTags') || [];
    const slug = getProp(card, 'slug', 'Slug');
    
    if ((!tagsRaw || (Array.isArray(tagsRaw) && tagsRaw.length === 0) || (typeof tagsRaw === 'string' && !tagsRaw.trim())) && slug && fetchedTags[slug]) {
      tagsRaw = fetchedTags[slug];
    }
    
    let tagsArr = [];
    if (Array.isArray(tagsRaw)) {
      tagsArr = tagsRaw.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
      tagsArr = tagsRaw.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    return tagsArr;
  }, [getProp]);


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
            const list = await userAPI.getBookmarks();
            const map = {};
            for (const b of list) {
              const key = String(b.BusinessUserId ?? b.businessUserId);
              if (key) map[key] = true;
            }
            if (!cancelled) setBookmarkedIds(map);
          } catch (e) {
            logger.error('Failed to fetch bookmarks:', e);
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
        const list = await businessAPI.getCards();
        published = Array.isArray(list) ? list.filter(c => (c.IsPublished !== undefined ? c.IsPublished : c.isPublished)) : [];
      } catch (e) {
        logger.error('Failed to fetch business cards:', e);
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

      // fetch tags for slugs using API service
      const fetchSlugTags = async () => {
        if (slugsToFetch.length === 0) return {};
        const promises = slugsToFetch.map(async (slug) => {
          try {
            const data = await businessAPI.getCard(slug);
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

      // fetch ratings using API service
      const fetchRatings = async () => {
        const ids = Array.from(businessIdsToFetch);
        if (ids.length === 0) return {};
        const promises = ids.map(async (id) => {
          try {
            const data = await businessAPI.getReviewStats(id);
            const avgRating = data?.averageRating ?? 0;
            return { businessId: id, avg: Number(avgRating) };
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

      // fetch primary images using API service
      const fetchPrimaryImages = async () => {
        const businessIds = Array.from(businessIdsToFetch);
        if (businessIds.length === 0) return {};
        const promises = businessIds.map(async (businessId) => {
          try {
            const images = await businessAPI.getImages(businessId);
            const primaryImage = Array.isArray(images) ? images.find(img => img.isPrimary || img.IsPrimary) : null;
            return { businessId, primaryImage: primaryImage?.url || primaryImage?.Url || null };
          } catch (e) {
            // Log 404s as info level since missing images are expected for some businesses
            if (e.message.includes('404')) {
              logger.info(`No images found for business ${businessId}`);
            } else {
              logger.error(`Error fetching images for business ${businessId}:`, e.message);
            }
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
            // Setting primary images in state
            setPrimaryImages(prev => ({ ...prev, ...fetchedImages }));
          }
        }
      } catch (e) {
        // ignore per-item errors
      }
    };

    load();
    return () => { cancelled = true; };
  }, [getProp]);

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

      const tagsArr = processOwnershipTags(c, fetchedTags);
      for (const t of tagsArr) tags.add(t);
    }

    const defaultTags = ['Black-Owned', 'Asian-Owned', 'LGBTQ+ Owned', 'Women-Owned', 'Latin-Owned'];
    const merged = Array.from(new Set([...defaultTags, ...Array.from(tags)])).sort();
    return { 
      availableCategories: Array.from(cats).sort(), 
      availableCities: Array.from(cities).sort(),
      availableOwnedTags: merged 
    };
  }, [cards, fetchedTags, processOwnershipTags]);

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
        const tagsArr = processOwnershipTags(c, fetchedTags);
        return selectedOwnedTags.some(sel => tagsArr.includes(sel));
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
  }, [cards, search, selectedCategory, selectedCity, selectedOwnedTags, sortOption, fetchedTags, ratings, processOwnershipTags]);

  // ---------- Handlers: stable via useCallback ----------

  const toggleBookmarkLocalAndRemote = useCallback(async (idStr, numericId) => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    logger.info('Auth check - userId:', userId);
    
    if (!userId) {
      logger.warn('User not authenticated - userId:', userId);
      alert('Please log in to bookmark businesses');
      navigate('/login');
      return;
    }

    // Set loading state
    setBookmarkLoading(prev => ({ ...prev, [idStr]: true }));

    // optimistic update
    setBookmarkedIds(prev => {
      const next = { ...prev };
      if (next[idStr]) delete next[idStr];
      else next[idStr] = true;
      return next;
    });

    try {
      await userAPI.toggleBookmark(numericId);
      logger.info('Bookmark toggled successfully for business ID:', numericId);
    } catch (err) {
      logger.error('Failed to toggle bookmark:', err);
      
      // Handle authentication errors specifically
      if (err.message.includes('User not authenticated') || err.message.includes('Session expired')) {
        alert('Please log in again');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        navigate('/login');
        return;
      }
      
      alert(`Failed to ${bookmarkedIds[idStr] ? 'remove' : 'add'} bookmark: ${err.message}`);
      // revert on failure
      setBookmarkedIds(prev => {
        const next = { ...prev };
        if (next[idStr]) delete next[idStr];
        else next[idStr] = true;
        return next;
      });
    } finally {
      // Clear loading state
      setBookmarkLoading(prev => {
        const next = { ...prev };
        delete next[idStr];
        return next;
      });
    }
  }, [bookmarkedIds, navigate]);

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

  // Render individual card component
  const renderCard = useCallback((c) => {
    const businessIdFromCard = getProp(c, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id');

    const name = capitalizeText(getProp(c, 'businessName', 'BusinessName', 'name', 'Name') || 'Untitled');
    const category = capitalizeText((getProp(c, 'category', 'Category', 'businessCategory', 'BusinessCategory') || 'Uncategorized').toString().trim());
    const city = capitalizeText(getProp(c, 'city', 'City') || '');
    const address = capitalizeText(getProp(c, 'address', 'Address', 'streetAddress', 'StreetAddress', 'addressLine1', 'AddressLine1') || '');
    const desc = getProp(c, 'description', 'Description') || '';
    const slug = getProp(c, 'slug', 'Slug') || '';

    // bookmark button logic (prefers numeric businessUserId)
    const numericId = businessIdFromCard ?? getProp(c, 'id', 'Id');
    const bidNum = numericId ? Number(numericId) : NaN;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const showBookmark = Number.isFinite(bidNum) && userId; // Only show if user is authenticated
    const idStr = String(bidNum);
    const isBookmarked = Boolean(bookmarkedIds[idStr]);
    const isLoading = Boolean(bookmarkLoading[idStr]);

    // Get primary image URL or use placeholder
    const primaryImageUrl = businessIdFromCard && primaryImages[businessIdFromCard] 
      ? (primaryImages[businessIdFromCard].startsWith('http') 
          ? primaryImages[businessIdFromCard] 
          : `${API_BASE_URL}${primaryImages[businessIdFromCard]}`)
      : 'https://via.placeholder.com/400x250/1f1f1f/fbfbfb?text=Business+Image';

    return (
      <div key={businessIdFromCard || getProp(c, 'id', 'Id') || name + slug} className="w-full h-full transition-all duration-500 ease-in-out">
        <Link 
          to={`/cards/${encodeURIComponent(slug)}`} 
          className="block bg-black/80 border border-yellow-300/20 rounded-lg overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-yellow-300/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col"
        >
          {/* Business Image - Always shown */}
          <div className="relative w-full overflow-hidden">
            <div className="w-full h-48 overflow-hidden">
              <img
                src={primaryImageUrl}
                alt={name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
            
            {/* Category badge on image */}
            <div className="absolute top-2 left-2">
              <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-medium shadow-lg">
                {category}
              </span>
            </div>

            {/* Bookmark button on image */}
            {showBookmark && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isLoading) return; // Prevent double clicks
                  logger.info('Bookmark button clicked for business ID:', bidNum);
                  try {
                    await toggleBookmarkLocalAndRemote(idStr, bidNum);
                  } catch (error) {
                    logger.error('Error in bookmark button click:', error);
                  }
                }}
                disabled={isLoading}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-sm border border-yellow-400/50 text-yellow-300 hover:bg-yellow-400 hover:text-black transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isLoading ? 'Processing...' : (isBookmarked ? 'Remove bookmark' : 'Bookmark')}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  isBookmarked ? <CiBookmarkMinus className="w-4 h-4" /> : <CiBookmarkPlus className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Card Content */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Ownership tags */}
            {(() => {
              const tagsArr = processOwnershipTags(c, fetchedTags);
              
              if (tagsArr.length > 0) {
                return (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tagsArr.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full font-medium border border-yellow-400/30">
                        {capitalizeText(t)}
                      </span>
                    ))}
                    {tagsArr.length > 2 && (
                      <span className="text-xs bg-gray-700/80 text-yellow-300 px-2 py-1 rounded-full font-medium border border-gray-600">
                        +{tagsArr.length - 2}
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Business name and rating */}
            <div className="mb-3">
              <h2 className="text-lg font-bold text-yellow-50 mb-2 line-clamp-2 leading-tight">{name}</h2>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const businessId = businessIdFromCard;
                  const fetched = businessId ? ratings[businessId] : undefined;
                  const fallback = getProp(c, 'averageRating', 'AverageRating', 'avgRating', 'rating', 'Rating') || 0;
                  const raw = (fetched !== undefined && fetched !== null) ? fetched : fallback;
                  const ratingNum = typeof raw === 'number' ? raw : Number(raw || 0);
                  return <StarRating rating={ratingNum} />;
                })()}
              </div>

              {/* Location - Separated City and Address */}
              <div className="space-y-1">
                {city && (
                  <div className="text-yellow-200/80 text-sm flex items-center gap-2">
                    <HiMapPin className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                    <span className="line-clamp-1">{city}</span>
                  </div>
                )}
                {address && (
                  <div className="text-yellow-200/70 text-sm flex items-center gap-2 pl-6">
                    <span className="line-clamp-1">{address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description - If exists */}
            {desc && (
              <div className="mt-auto">
                <p className="text-yellow-200/80 text-sm line-clamp-3 leading-relaxed">{desc}</p>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }, [getProp, primaryImages, bookmarkedIds, bookmarkLoading, toggleBookmarkLocalAndRemote, processOwnershipTags, fetchedTags, ratings]);

  // ---------- Render ----------
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <HoneycombBackground />

      <div className="relative z-10 p-0 min-h-screen w-full flex flex-col items-center">

        <div
          className="fixed top-0 left-0 right-0 bg-[#050505] border-b border-yellow-400 shadow-sm z-30"
        >
          <div className={`w-full mx-auto max-w-none py-4 flex flex-col items-center gap-4 transition-all duration-500 ease-in-out ${
            hasNavbar && isNavbarOpen 
              ? 'px-8' // Reduced padding when navbar open
              : 'px-16' // Full padding when navbar closed
          }`}>
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
          <div className={`w-full mx-auto py-8 mt-8 transition-all duration-500 ease-in-out ${
            hasNavbar && isNavbarOpen 
              ? 'max-w-none px-8' // Reduced padding when navbar open
              : 'max-w-none px-16' // Full padding when navbar closed
          }`}>
            <div className="mt-16">
              {cards.length === 0 && <div className="text-yellow-200">No published cards yet.</div>}
              {cards.length > 0 && displayCards.length === 0 && (
                <div className="text-yellow-200">No results match your search.</div>
              )}

              {/* Responsive Grid Layout - Reduces from 5 to 4 columns when navbar open */}
              <div className={`grid gap-6 transition-all duration-500 ease-in-out ${
                hasNavbar && isNavbarOpen
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // Max 4 columns when navbar open
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' // Max 5 columns when navbar closed
              }`}>
                {(bookmarksOnly ? displayCards.filter(dc => {
                  const id = getProp(dc, 'businessUserId', 'BusinessUserId', 'businessId', 'BusinessId', 'id', 'Id') || getProp(dc, 'slug', 'Slug');
                  return id && bookmarkedIds[String(id)];
                }) : displayCards).map(c => {
                  return renderCard(c);
                })}
              </div>


            </div>
          </div>
        </main>
      </div>
    </div>
  );
}