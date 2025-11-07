import HoneycombBackground from '../Components/HoneycombBackground';
import PageTransition from '../Components/PageTransition';
import React, { useEffect, useState } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import { useNavbar } from '../contexts/NavbarContext';
import { 
  HiExclamationTriangle, 
  HiInformationCircle, 
  HiLockClosed, 
  HiPhone, 
  HiMapPin, 
  HiGlobeAlt,
  HiTag,
  HiEye,
  HiEyeSlash,
  HiArrowPath,
  HiCheckCircle
} from 'react-icons/hi2';

export function ManageBusiness() {
  const { isNavbarOpen } = useNavbar();
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [ownershipTags, setOwnershipTags] = useState([]);
  const ownershipOptions = [
    'Black-Owned',
    'Asian-Owned',
    'LGBTQ+ Owned',
    'Latin-Owned',
    'Women-Owned'
  ];
  const [dirty, setDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manageBusiness');
  const [errors, setErrors] = useState({ address: '', city: '', phone: '', description: '' });
  const [isPublished, setIsPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // helper to fetch full card by slug (used in multiple places)
  const fetchFullCardBySlug = async (slug) => {
    if (!slug) return null;
    try {
      const backendBase = 'http://localhost:5236';
      const fullRes = await fetch(`${backendBase}/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
      if (!fullRes.ok) return null;
      return await fullRes.json();
    } catch (err) {
      console.debug('fetchFullCardBySlug failed', err);
      return null;
    }
  };

  // refresh the current user's card state (used after toggling publish)
  const refreshCardState = async () => {
    try {
      const backendBase = 'http://localhost:5236';
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`${backendBase}/api/ManageBusiness/cards`);
      if (!res.ok) return;
      const list = await res.json();
      const myCard = list.find(bc => String(bc.BusinessUserId || bc.businessUserId || bc.Id || bc.id) === String(userId));
      if (!myCard) return;
      // try to read published flag from listing or fetch full card
      const published = (myCard.IsPublished !== undefined) ? myCard.IsPublished : myCard.isPublished;
      if (typeof published !== 'undefined') setIsPublished(Boolean(published));
      else {
        const slug = myCard.slug || myCard.Slug || '';
        const full = await fetchFullCardBySlug(slug);
        if (full && typeof full.IsPublished !== 'undefined') setIsPublished(Boolean(full.IsPublished));
      }
    } catch (e) {
      console.debug('refreshCardState failed', e);
    }
  };

  const validatePhone = (value) => {
    
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) return 'Phone is required';
    if (digits.length < 7 || digits.length > 15) return 'Phone must be 7-15 digits';
    return '';
  };

  const validateAll = (a, c, p, d) => {
    const newErrors = { address: '', city: '', phone: '', description: '' };
    if (!a || !a.trim()) newErrors.address = 'Address is required';
    if (!c || !c.trim()) newErrors.city = 'City is required';
    newErrors.phone = validatePhone(p);
    if (!d || !d.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return !(newErrors.address || newErrors.city || newErrors.phone || newErrors.description);
  };

  
  const showRequired = (value, validator) => {
    if (!value || !String(value).trim()) return true;
    if (typeof validator === 'function') return Boolean(validator(value));
    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const fallbackFromLocal = () => {
      const candidates = ['businessName', 'business', 'bizName'];
      for (const k of candidates) {
        const v = localStorage.getItem(k);
        if (!v) continue;
        try {
          const parsed = JSON.parse(v);
          if (parsed && parsed.businessName) {
            setBusinessName(parsed.businessName);
            return true;
          }
        } catch (parseErr) {
          console.debug('fallbackFromLocal: parse error for', k, parseErr);
        }
        setBusinessName(v);
        return true;
      }

      const emailCandidates = ['email', 'businessEmail', 'bizEmail', 'userEmail'];
      for (const k of emailCandidates) {
        const ev = localStorage.getItem(k);
        if (!ev) continue;
        try {
          const parsedE = JSON.parse(ev);
          if (parsedE && parsedE.email) {
            setEmail(parsedE.email);
            break;
          }
        } catch (parseErr) {
          console.debug('fallbackFromLocal: parse email error for', k, parseErr);
        }
        setEmail(ev);
        break;
      }
      return false;
    };

    if (!userId) {
      fallbackFromLocal();
      return;
    }

    // helper to extract BusinessUserId from various shapes
    const extractBusinessUserId = (bc) => bc?.businessUserId ?? bc?.BusinessUserId ?? bc?.businessUser ?? bc?.BusinessUser ?? bc?.businessuserid ?? null;

    const fetchFullCardBySlug = async (slug) => {
      if (!slug) return null;
      try {
        const backendBase = 'http://localhost:5236';
        const fullRes = await fetch(`${backendBase}/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
        if (!fullRes.ok) return null;
        return await fullRes.json();
      } catch (err) {
        console.debug('fetchFullCardBySlug failed', err);
        return null;
      }
    };

    const refreshCardState = async () => {
      try {
        const backendBase = 'http://localhost:5236';
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await fetch(`${backendBase}/api/ManageBusiness/cards`);
        if (!res.ok) return;
        const list = await res.json();
        const myCard = list.find(bc => String(bc.BusinessUserId || bc.businessUserId || bc.Id || bc.id) === String(userId));
        if (!myCard) return;
        // try to read published flag from listing or fetch full card
        const published = (myCard.IsPublished !== undefined) ? myCard.IsPublished : myCard.isPublished;
        if (typeof published !== 'undefined') setIsPublished(Boolean(published));
        else {
          const slug = myCard.slug || myCard.Slug || '';
          const full = await fetchFullCardBySlug(slug);
          if (full && typeof full.IsPublished !== 'undefined') setIsPublished(Boolean(full.IsPublished));
        }
      } catch (e) {
        console.debug('refreshCardState failed', e);
      }
    };

    const fetchAndPopulate = async () => {
      setLoading(true);
      try {
        const backendBase = 'http://localhost:5236';

        // Try to fetch registration info (optional). If present, populate name/email/category.
        try {
          const res = await fetch(backendBase + '/api/BusinessRegistration/all', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const textBody = await res.text();
            try {
              const list = JSON.parse(textBody);
              const found = list.find(b => String(b.Id) === String(userId) || String(b.id) === String(userId));
              if (found) {
                const name = found.BusinessName || found.businessName || found.Name || found.name || '';
                setBusinessName(name || 'Your Business');
                const e = found.Email || found.email || found.EmailAddress || found.emailAddress || '';
                if (e) setEmail(e);
                const cat = found.BusinessCategory || found.businessCategory || '';
                if (cat) setBusinessCategory(cat);
              }
            } catch (parseErr) {
              console.debug('Failed to parse registration response', parseErr);
            }
          }
        } catch (regErr) {
          console.debug('Registration fetch failed', regErr);
        }

        // Fetch cards list and then the full card by slug to get address/phone/details
        try {
          const cardsRes = await fetch(`${backendBase}/api/ManageBusiness/cards`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!cardsRes.ok) {
            fallbackFromLocal();
            return;
          }
          const list = await cardsRes.json();
          const myCard = list.find(bc => String(extractBusinessUserId(bc)) === String(userId));
          if (!myCard) {
            fallbackFromLocal();
            return;
          }
          // set published state from the listing if available (will be overridden by full fetch when present)
          const listedPublished = myCard.IsPublished !== undefined ? myCard.IsPublished : myCard.isPublished;
          if (typeof listedPublished !== 'undefined') setIsPublished(Boolean(listedPublished));

          const slug = myCard.slug || myCard.Slug || '';
          const full = await fetchFullCardBySlug(slug);
          if (full) {
            if (full.BusinessName) setBusinessName(full.BusinessName);
            if (full.Email) setEmail(full.Email);
            if (typeof full.IsPublished !== 'undefined') setIsPublished(Boolean(full.IsPublished));
            setAddress(full.Address || full.address || '');
            setCity(full.City || full.city || '');
            setPhone(full.Phone || full.phone || '');
            setDescription(full.Description || full.description || '');
            setBusinessCategory(full.Category || full.category || myCard.Category || myCard.category || '');
            const ot = full.OwnershipTags ?? full.ownershipTags ?? '';
            if (Array.isArray(ot)) {
              setOwnershipTags(ot.map(s => String(s).trim()).filter(Boolean));
            } else if (typeof ot === 'string' && ot.trim()) {
              setOwnershipTags(ot.split(',').map(s => s.trim()).filter(Boolean));
            } else {
              setOwnershipTags([]);
            }
            setDirty(false);
          } else {
            // fall back to listing fields if full fetch failed
              setCity(myCard.City || myCard.city || '');
              setDescription(myCard.Description || myCard.description || '');
              setAddress(myCard.Address || myCard.address || '');
              setPhone(myCard.Phone || myCard.phone || '');
            setBusinessCategory(myCard.Category || myCard.category || '');
            const ot2 = myCard.OwnershipTags ?? myCard.ownershipTags ?? '';
            if (Array.isArray(ot2)) {
              setOwnershipTags(ot2.map(s => String(s).trim()).filter(Boolean));
            } else if (typeof ot2 === 'string' && ot2.trim()) {
              setOwnershipTags(ot2.split(',').map(s => s.trim()).filter(Boolean));
            } else {
              setOwnershipTags([]);
            }
          }
        } catch (cardsErr) {
          console.debug('Failed to fetch manage business cards', cardsErr);
          fallbackFromLocal();
        }
      } catch (err) {
        console.warn('fetchAndPopulate failed', err);
        fallbackFromLocal();
      } finally {
        setLoading(false);
      }
    };

    fetchAndPopulate();
  }, []);

  // Auto-hide success messages
  useEffect(() => {
    if (saveSuccess && statusMessage.includes('Successfully')) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
        setStatusMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, statusMessage]);

  // Ensure the app favicon stays the site's bee icon when this page mounts.
  // Vite/HMR client can sometimes replace the favicon with its own during dev.
  useEffect(() => {
    try {
      const setFavicon = (href) => {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      };
      setFavicon('/bee.png');
    } catch (e) {
      // ignore in environments without DOM
    }
  }, []);
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
          <main className="pt-24 relative z-10 p-6">
        
        {/* Enhanced Header */}
        <div className="max-w-6xl mx-auto mb-8 mt-10">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-yellow-100 mb-4 flex items-center justify-center gap-3">
              <span className="inline-block bg-black px-6 py-3 rounded-xl border border-yellow-700/20 shadow-2xl">
                Business Management
              </span>
            </h1>
            <p className="text-black-200 text-lg max-w-2xl mx-auto">
              Manage your business information and make it discoverable to customers in your area
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-yellow-100">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main Form */}
            <div className="lg:col-span-3">
              <div className="relative bg-black/90 border border-yellow-300/20 rounded-3xl p-8 shadow-2xl">
                {loading && (
                  <div className="absolute inset-0 bg-black/70 z-40 rounded-3xl flex items-center justify-center">
                    <div className="flex items-center gap-3 text-yellow-200 text-lg font-semibold">
                      <HiArrowPath className="w-6 h-6 animate-spin" />
                      Loading...
                    </div>
                  </div>
                )}
                
                {/* Form Sections */}
                <div className="space-y-8">
                  {/* Business Identity Section */}
                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-yellow-300/10">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      <HiInformationCircle className="w-6 h-6" />
                      Business Identity
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">Business Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={businessName || 'Your Business Name'}
                            className="w-full rounded-xl border border-gray-600 bg-gray-800 text-yellow-100 px-4 py-3 text-xl font-bold focus:outline-none pr-12"
                          />
                          <HiLockClosed className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <div className="pointer-events-none absolute inset-0 bg-gray-900/30 rounded-xl" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Contact support to change your business name</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">Email Address</label>
                        <div className="relative">
                          <input
                            type="email"
                            readOnly
                            value={email || ''}
                            placeholder="you@business.com"
                            className="w-full rounded-xl border border-gray-600 bg-gray-800 text-yellow-100 px-4 py-3 focus:outline-none pr-12"
                          />
                          <HiLockClosed className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <div className="pointer-events-none absolute inset-0 bg-gray-900/30 rounded-xl" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Used for account management and notifications</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Contact Section */}
                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-yellow-300/10">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      <HiMapPin className="w-6 h-6" />
                      Location & Contact
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">
                          Street Address
                          {showRequired(address) && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => { const v = e.target.value; setAddress(v); setDirty(true); validateAll(v, city, phone, description); }}
                            disabled={loading}
                            placeholder="123 Main Street"
                            className={`w-full rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                          <HiMapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">
                          City
                          {showRequired(city) && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => { const v = e.target.value; setCity(v); setDirty(true); validateAll(address, v, phone, description); }}
                          disabled={loading}
                          placeholder="Your city"
                          className={`w-full rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-200 mb-2">
                        Phone Number
                        {showRequired(phone, validatePhone) && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => { const v = e.target.value; setPhone(v); setDirty(true); validateAll(address, city, v, description); }}
                          disabled={loading}
                          placeholder="(555) 555-5555"
                          className={`w-full rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        <HiPhone className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Business Details Section */}
                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-yellow-300/10">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      <HiTag className="w-6 h-6" />
                      Business Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">Category</label>
                        <select
                          value={businessCategory}
                          onChange={(e) => { setBusinessCategory(e.target.value); setDirty(true); }}
                          disabled={loading}
                          className="w-full rounded-xl border border-gray-600 focus:border-yellow-400 bg-black text-yellow-100 px-4 py-3 focus:outline-none transition-colors"
                        >
                          <option value="">Select a category</option>
                          <option>Food & Beverage</option>
                          <option>Retail</option>
                          <option>Health & Wellness</option>
                          <option>Professional Services</option>
                          <option>Home & Garden</option>
                          <option>Entertainment</option>
                          <option>Education</option>
                          <option>Technology</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">
                          Business Description
                          {showRequired(description) && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => { const v = e.target.value; setDescription(v); setDirty(true); validateAll(address, city, phone, v); }}
                          disabled={loading}
                          placeholder="Tell customers about your business, services, and what makes you unique..."
                          rows={5}
                          className={`w-full rounded-xl border ${errors.description ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none transition-colors resize-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">This description helps customers understand what you offer</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">Ownership Tags</label>
                        <p className="text-xs text-yellow-300 mb-3">Optional — select any that apply to help customers find businesses like yours</p>
                        <div className="w-full rounded-xl border border-gray-600 bg-black px-4 py-4">
                          <div className="flex flex-wrap gap-3">
                            {ownershipOptions.map(opt => {
                              const selected = ownershipTags.includes(opt);
                              return (
                                <label key={opt} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${selected ? 'bg-yellow-400 text-black shadow-lg' : 'bg-gray-800 text-yellow-200 hover:bg-gray-700'}`}>
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => {
                                      setDirty(true);
                                      if (e.target.checked) setOwnershipTags(prev => [...prev, opt]);
                                      else setOwnershipTags(prev => prev.filter(p => p !== opt));
                                    }}
                                    className="w-4 h-4 rounded"
                                  />
                                  <span className="text-sm font-medium">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Preview Toggle */}
                <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-6">
                  <div className="text-center">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors border border-blue-500/20 w-full justify-center"
                    >
                      <HiGlobeAlt className="w-5 h-5" />
                      <span className="font-medium">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                    <p className="text-yellow-300 text-sm mt-3">
                      See how customers view your business
                    </p>
                  </div>
                </div>

                {/* Preview Card */}
                {showPreview && (
                  <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      <HiEye className="w-5 h-5" />
                      Customer View
                    </h4>
                    <div className="bg-gray-900 rounded-xl p-4 border border-yellow-300/10">
                      <h5 className="text-lg font-bold text-yellow-50">{businessName || 'Your Business'}</h5>
                      <p className="text-yellow-200 text-sm mt-1">{businessCategory || 'Uncategorized'}</p>
                      {(address || city) && (
                        <div className="text-yellow-200 text-sm mt-2 flex flex-col items-start gap-0">
                          {address ? <span className="block leading-tight flex items-center gap-1"><HiMapPin className="w-4 h-4 text-yellow-300" />{address}</span> : null}
                          {city ? <span className="block leading-tight text-yellow-200/90 mt-0.5 ml-5">{city}</span> : null}
                        </div>
                      )}
                      {description && (
                        <p className="text-yellow-200 text-sm mt-3 line-clamp-3">{description}</p>
                      )}
                      {ownershipTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {ownershipTags.map((tag, i) => (
                            <span key={i} className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${isPublished ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}`}>
                      {isPublished ? <HiEye className="w-4 h-4" /> : <HiEyeSlash className="w-4 h-4" />}
                      <span className="font-medium">{isPublished ? 'Published' : 'Draft'}</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-2">
                      {isPublished ? 'Visible to customers' : 'Hidden from public'}
                    </p>
                  </div>
                  
                  <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${dirty ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
                      {dirty ? <HiExclamationTriangle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                      <span className="font-medium">{dirty ? 'Unsaved Changes' : 'Saved'}</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-2">
                      {dirty ? 'Don\'t forget to save' : 'All changes saved'}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4">Actions</h4>
                  
                  {/* Status Message */}
                  {statusMessage && (
                    <div className={`p-3 rounded-lg mb-4 ${saveSuccess ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      <div className="flex items-center gap-2">
                        {saveSuccess ? <HiCheckCircle className="w-5 h-5" /> : <HiExclamationTriangle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{statusMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {/* Publish/Unpublish Button */}
                    <button
                      onClick={async () => {
                        setStatusMessage('');
                        setSaveSuccess(false);
                        const backendBase = 'http://localhost:5236';
                        const userId = localStorage.getItem('userId');
                        const token = localStorage.getItem('token');
                        if (!userId) {
                          setStatusMessage('Not signed in - cannot change publish state');
                          return;
                        }
                        setLoading(true);
                        try {
                          const publish = !isPublished;
                          const res = await fetch(`${backendBase}/api/ManageBusiness/toggle-publish/${userId}?publish=${publish}`, {
                            method: 'POST',
                            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                          });
                          const text = await res.text();
                          if (!res.ok) {
                            let msg = text;
                            try {
                              const obj = JSON.parse(text);
                              msg = obj?.message || text;
                            } catch { }
                            throw new Error(msg || res.statusText);
                          }
                          let data = {};
                          try { data = JSON.parse(text); } catch { }
                          setIsPublished(Boolean(data.isPublished));
                          setStatusMessage(data.message || 'Updated');
                          setSaveSuccess(true);
                          await refreshCardState();
                        } catch (err) {
                          console.warn('toggle-publish failed', err);
                          setStatusMessage('Failed to update publish state: ' + (err?.message || String(err)));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isPublished 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] shadow-lg'} flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <HiArrowPath className="w-5 h-5 animate-spin" />
                      ) : isPublished ? (
                        <HiEyeSlash className="w-5 h-5" />
                      ) : (
                        <HiEye className="w-5 h-5" />
                      )}
                      {isPublished ? 'Hide from Public' : 'Make Public'}
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={async () => {
                        setStatusMessage('');
                        setSaveSuccess(false);
                        const isValid = validateAll(address, city, phone, description);
                        if (!dirty || !isValid) return;
                        try {
                          setLoading(true);
                          const backendBase = 'http://localhost:5236';
                          const userId = localStorage.getItem('userId');
                          const token = localStorage.getItem('token');
                          const payload = { Id: Number(userId || 0), Address: address, City: city, Phone: phone, Description: description };
                          if (businessCategory) payload.BusinessCategory = businessCategory;
                          payload.OwnershipTags = Array.isArray(ownershipTags) ? ownershipTags : [];
                          payload.IsPublished = true;
                          const res = await fetch(backendBase + '/api/ManageBusiness/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                            body: JSON.stringify(payload),
                          });
                          const text = await res.text();
                          if (!res.ok) throw new Error(text || res.statusText);
                          setStatusMessage('Saved & Published Successfully');
                          setSaveSuccess(true);
                          setIsPublished(true);
                          setDirty(false);
                        } catch (err) {
                          setStatusMessage('Failed to save: ' + (err?.message || String(err)));
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={!dirty || Boolean(errors.address || errors.city || errors.phone || errors.description) || loading}
                      className={`w-full px-4 py-3 rounded-xl bg-yellow-400 text-black font-semibold transition-all ${
                        (!dirty || loading || Boolean(errors.address || errors.city || errors.phone || errors.description)) 
                          ? 'opacity-70 cursor-not-allowed' 
                          : 'hover:scale-[1.02] hover:bg-yellow-300 shadow-lg'
                      } flex items-center justify-center gap-2`}
                    >
                      {loading ? (
                        <HiArrowPath className="w-5 h-5 animate-spin" />
                      ) : (
                        <HiCheckCircle className="w-5 h-5" />
                      )}
                      Save & Publish
                    </button>
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