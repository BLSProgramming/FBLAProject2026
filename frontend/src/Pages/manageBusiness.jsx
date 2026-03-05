import PageShell from '../Components/PageShell';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import ManageBusinessNavbar from '../Components/ManageBusinessNavbar';
import { useNavbar } from '../contexts/NavbarContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, OWNERSHIP_TAGS, BUSINESS_CATEGORIES } from '../utils/constants';
import { logger, formatPhoneDisplay } from '../utils/helpers';
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
  HiCheckCircle,
  HiArrowUturnLeft,
  HiDocumentText
} from 'react-icons/hi2';

// ── Constants ──────────────────────────────────────────────
const DESCRIPTION_MAX_CHARS = 500;
const PHONE_PATTERN = /^[\d\s()+-]+$/;

// ── Component ──────────────────────────────────────────────
export function ManageBusiness() {
  const { isNavbarOpen } = useNavbar();
  const { user } = useAuth();
  const authUserId = user?.userId ?? null;
  const authToken = user?.token ?? null;

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [ownershipTags, setOwnershipTags] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manageBusiness');
  const [errors, setErrors] = useState({ address: '', city: '', phone: '', description: '' });
  const [isPublished, setIsPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Snapshot for "discard changes"
  const savedSnapshot = useRef({});
  const ownershipOptions = OWNERSHIP_TAGS;

  // ── Warn on unsaved changes when leaving page ──────────
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // ── Derived values ─────────────────────────────────────
  const descCharCount = description.length;
  const descOverLimit = descCharCount > DESCRIPTION_MAX_CHARS;
  const hasErrors = Boolean(errors.address || errors.city || errors.phone || errors.description);

  const formProgress = useMemo(() => {
    const fields = [address, city, phone, description];
    const filled = fields.filter(v => v && String(v).trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [address, city, phone, description]);

  // ── Validation ─────────────────────────────────────────
  const validatePhone = useCallback((value) => {
    const digits = (value || '').replace(/\D/g, '');
    if (!digits) return 'Phone is required';
    if (digits.length < 7 || digits.length > 15) return 'Phone must be 7-15 digits';
    return '';
  }, []);

  const validateAll = useCallback((a, c, p, d) => {
    const newErrors = { address: '', city: '', phone: '', description: '' };
    if (!a || !a.trim()) newErrors.address = 'Address is required';
    if (!c || !c.trim()) newErrors.city = 'City is required';
    newErrors.phone = validatePhone(p);
    if (!d || !d.trim()) newErrors.description = 'Description is required';
    if (d && d.length > DESCRIPTION_MAX_CHARS) newErrors.description = `Description exceeds ${DESCRIPTION_MAX_CHARS} characters`;
    setErrors(newErrors);
    return !(newErrors.address || newErrors.city || newErrors.phone || newErrors.description);
  }, [validatePhone]);

  const showRequired = useCallback((value, validator) => {
    if (!value || !String(value).trim()) return true;
    if (typeof validator === 'function') return Boolean(validator(value));
    return false;
  }, []);

  // ── Field change handlers ──────────────────────────────
  const handleAddressChange = useCallback((e) => {
    const v = e.target.value;
    setAddress(v); setDirty(true);
    validateAll(v, city, phone, description);
  }, [city, phone, description, validateAll]);

  const handleCityChange = useCallback((e) => {
    const v = e.target.value;
    setCity(v); setDirty(true);
    validateAll(address, v, phone, description);
  }, [address, phone, description, validateAll]);

  const handlePhoneChange = useCallback((e) => {
    const raw = e.target.value;
    if (raw && !PHONE_PATTERN.test(raw)) return;
    setPhone(raw); setDirty(true);
    validateAll(address, city, raw, description);
  }, [address, city, description, validateAll]);

  const handleDescriptionChange = useCallback((e) => {
    const v = e.target.value;
    setDescription(v); setDirty(true);
    validateAll(address, city, phone, v);
  }, [address, city, phone, validateAll]);

  const handleCategoryChange = useCallback((e) => {
    setBusinessCategory(e.target.value);
    setDirty(true);
  }, []);

  const handleTagToggle = useCallback((opt) => {
    setDirty(true);
    setOwnershipTags(prev =>
      prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]
    );
  }, []);

  // ── Discard changes ────────────────────────────────────
  const handleDiscard = useCallback(() => {
    const s = savedSnapshot.current;
    setAddress(s.address ?? '');
    setCity(s.city ?? '');
    setPhone(s.phone ?? '');
    setDescription(s.description ?? '');
    setBusinessCategory(s.businessCategory ?? '');
    setOwnershipTags(s.ownershipTags ?? []);
    setDirty(false);
    setErrors({ address: '', city: '', phone: '', description: '' });
    setStatusMessage('');
    setSaveSuccess(false);
  }, []);

  // ── API helpers ────────────────────────────────────────
  const fetchFullCardBySlug = useCallback(async (slug) => {
    if (!slug) return null;
    try {
      const fullRes = await fetch(`${API_BASE_URL}/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
      if (!fullRes.ok) return null;
      return await fullRes.json();
    } catch (err) {
      logger.dev('fetchFullCardBySlug failed', err);
      return null;
    }
  }, []);

  const refreshCardState = useCallback(async () => {
    try {
      if (!authUserId) return;
      const res = await fetch(`${API_BASE_URL}/api/ManageBusiness/cards`);
      if (!res.ok) return;
      const list = await res.json();
      const myCard = list.find(bc => String(bc.BusinessUserId || bc.businessUserId || bc.Id || bc.id) === String(authUserId));
      if (!myCard) return;
      const published = myCard.IsPublished !== undefined ? myCard.IsPublished : myCard.isPublished;
      if (typeof published !== 'undefined') setIsPublished(Boolean(published));
      else {
        const slug = myCard.slug || myCard.Slug || '';
        const full = await fetchFullCardBySlug(slug);
        if (full && typeof full.IsPublished !== 'undefined') setIsPublished(Boolean(full.IsPublished));
      }
    } catch (e) {
      logger.dev('refreshCardState failed', e);
    }
  }, [authUserId, fetchFullCardBySlug]);

  // ── Save handler ───────────────────────────────────────
  const handleSave = useCallback(async () => {
    setStatusMessage('');
    setSaveSuccess(false);
    const isValid = validateAll(address, city, phone, description);
    if (!dirty || !isValid) return;
    try {
      setLoading(true);
      const payload = {
        Id: Number(authUserId || 0),
        Address: address, City: city, Phone: phone, Description: description,
        OwnershipTags: Array.isArray(ownershipTags) ? ownershipTags : [],
        IsPublished: true,
      };
      if (businessCategory) payload.BusinessCategory = businessCategory;
      const res = await fetch(`${API_BASE_URL}/api/ManageBusiness/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);
      setStatusMessage('Saved & Published Successfully');
      setSaveSuccess(true);
      setIsPublished(true);
      setDirty(false);
      savedSnapshot.current = { address, city, phone, description, businessCategory, ownershipTags: [...ownershipTags] };
    } catch (err) {
      setStatusMessage('Failed to save: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }, [address, city, phone, description, businessCategory, ownershipTags, dirty, authUserId, authToken, validateAll]);

  // ── Toggle publish handler ─────────────────────────────
  const handleTogglePublish = useCallback(async () => {
    setStatusMessage('');
    setSaveSuccess(false);
    if (!authUserId) { setStatusMessage('Not signed in — cannot change publish state'); return; }
    setLoading(true);
    try {
      const publish = !isPublished;
      const res = await fetch(`${API_BASE_URL}/api/ManageBusiness/toggle-publish/${authUserId}?publish=${publish}`, {
        method: 'POST',
        headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try { const obj = JSON.parse(text); msg = obj?.message || text; } catch { /* noop */ }
        throw new Error(msg || res.statusText);
      }
      let data = {};
      try { data = JSON.parse(text); } catch { /* noop */ }
      setIsPublished(Boolean(data.isPublished));
      setStatusMessage(data.message || 'Updated');
      setSaveSuccess(true);
      await refreshCardState();
    } catch (err) {
      logger.warn('toggle-publish failed', err);
      setStatusMessage('Failed to update publish state: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }, [authUserId, authToken, isPublished, refreshCardState]);

  // ── Initial data fetch ─────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userId = authUserId;
    const token = authToken;

    const fallbackFromLocal = () => {
      const candidates = ['businessName', 'business', 'bizName'];
      for (const k of candidates) {
        const v = localStorage.getItem(k);
        if (!v) continue;
        try {
          const parsed = JSON.parse(v);
          if (parsed && parsed.businessName) { setBusinessName(parsed.businessName); return true; }
        } catch (parseErr) { logger.dev('fallbackFromLocal: parse error for', k, parseErr); }
      }
      return false;
    };

    if (!userId) { fallbackFromLocal(); return; }

    const extractBusinessUserId = (bc) => bc?.businessUserId ?? bc?.BusinessUserId ?? bc?.businessUser ?? bc?.BusinessUser ?? bc?.businessuserid ?? null;

    const populateFromCard = (card) => {
      const name = card.BusinessName || card.businessName || '';
      if (name) setBusinessName(name);
      const e = card.Email || card.email || '';
      if (e) setEmail(e);
      setAddress(card.Address || card.address || '');
      setCity(card.City || card.city || '');
      setPhone(card.Phone || card.phone || '');
      setDescription(card.Description || card.description || '');
      setBusinessCategory(card.Category || card.category || '');
      const ot = card.OwnershipTags ?? card.ownershipTags ?? '';
      if (Array.isArray(ot)) setOwnershipTags(ot.map(s => String(s).trim()).filter(Boolean));
      else if (typeof ot === 'string' && ot.trim()) setOwnershipTags(ot.split(',').map(s => s.trim()).filter(Boolean));
      else setOwnershipTags([]);
    };

    const fetchAndPopulate = async () => {
      setLoading(true);
      try {
        // Cards list → full card by slug (includes BusinessName + Email)
        try {
          const cardsRes = await fetch(`${API_BASE_URL}/api/ManageBusiness/cards`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!cardsRes.ok) { fallbackFromLocal(); return; }
          const list = await cardsRes.json();
          const myCard = list.find(bc => String(extractBusinessUserId(bc)) === String(userId));
          if (!myCard) { fallbackFromLocal(); return; }

          // Populate name from card list
          const listedName = myCard.BusinessName || myCard.businessName || '';
          if (listedName) setBusinessName(listedName);

          const listedPublished = myCard.IsPublished !== undefined ? myCard.IsPublished : myCard.isPublished;
          if (typeof listedPublished !== 'undefined') setIsPublished(Boolean(listedPublished));

          const slug = myCard.slug || myCard.Slug || '';
          const full = await fetchFullCardBySlug(slug);
          if (full) {
            if (full.BusinessName) setBusinessName(full.BusinessName);
            if (full.Email) setEmail(full.Email);
            if (typeof full.IsPublished !== 'undefined') setIsPublished(Boolean(full.IsPublished));
            populateFromCard(full);
            // Save snapshot for discard
            savedSnapshot.current = {
              address: full.Address || full.address || '',
              city: full.City || full.city || '',
              phone: full.Phone || full.phone || '',
              description: full.Description || full.description || '',
              businessCategory: full.Category || full.category || myCard.Category || myCard.category || '',
              ownershipTags: (() => {
                const ot = full.OwnershipTags ?? full.ownershipTags ?? '';
                if (Array.isArray(ot)) return ot.map(s => String(s).trim()).filter(Boolean);
                if (typeof ot === 'string' && ot.trim()) return ot.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              })(),
            };
            setDirty(false);
          } else {
            populateFromCard(myCard);
          }
        } catch (cardsErr) {
          logger.dev('Failed to fetch manage business cards', cardsErr);
          fallbackFromLocal();
        }
      } catch (err) {
        logger.warn('fetchAndPopulate failed', err);
        fallbackFromLocal();
      } finally {
        setLoading(false);
      }
    };

    fetchAndPopulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Management Navbar */}
      <ManageBusinessNavbar active={activeTab} onChange={setActiveTab} isNavbarOpen={isNavbarOpen} />

      {/* Main Content Area */}
      <PageShell>
          <main className="pt-24 relative z-10 p-4 sm:p-6">

        {/* Header + Progress */}
        <div className="max-w-4xl mx-auto mb-10 mt-14">
          <div className="relative bg-black/80 backdrop-blur-md border border-yellow-400/20 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 shadow-2xl shadow-black/40 overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-yellow-500/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-yellow-50 mb-3">
                Business Management
              </h1>
              <p className="text-yellow-200/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Manage your business information and make it discoverable to customers in your area
              </p>
            </div>

            {/* Progress bar */}
            <div className="relative z-10 max-w-sm mx-auto mt-8">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-yellow-300/80 font-medium">Profile completeness</span>
                <span className={`font-bold tabular-nums ${formProgress === 100 ? 'text-green-400' : formProgress >= 60 ? 'text-yellow-300' : 'text-orange-400'}`}>
                  {formProgress}%
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    formProgress === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-400' : formProgress >= 60 ? 'bg-gradient-to-r from-yellow-400 to-amber-400' : 'bg-gradient-to-r from-orange-400 to-amber-500'
                  }`}
                  style={{ width: `${formProgress}%` }}
                />
              </div>
              {formProgress === 100 && (
                <p className="text-green-400/80 text-xs mt-2 flex items-center justify-center gap-1">
                  <HiCheckCircle className="w-3.5 h-3.5" />All required fields filled
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto text-yellow-100">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* ── Main Form ────────────────────────────── */}
            <div className="lg:col-span-3">
              <div className="relative bg-black/90 border border-yellow-300/20 rounded-3xl p-5 sm:p-8 shadow-2xl">
                {loading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40 rounded-3xl flex items-center justify-center">
                    <div className="flex items-center gap-3 text-yellow-200 text-lg font-semibold">
                      <HiArrowPath className="w-6 h-6 animate-spin" />
                      Loading…
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {/* ── Business Identity ──────────────── */}
                  <div className="bg-gray-900/50 rounded-2xl p-5 sm:p-6 border border-yellow-300/10 hover:border-yellow-300/20 transition-colors">
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
                          <HiLockClosed className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                          <HiLockClosed className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <div className="pointer-events-none absolute inset-0 bg-gray-900/30 rounded-xl" />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Used for account management and notifications</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Location & Contact ─────────────── */}
                  <div className="bg-gray-900/50 rounded-2xl p-5 sm:p-6 border border-yellow-300/10 hover:border-yellow-300/20 transition-colors">
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
                            onChange={handleAddressChange}
                            disabled={loading}
                            placeholder="123 Main Street"
                            className={`w-full rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          />
                          <HiMapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                        {errors.address && (
                          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <HiExclamationTriangle className="w-3.5 h-3.5" />{errors.address}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">
                          City
                          {showRequired(city) && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={handleCityChange}
                          disabled={loading}
                          placeholder="Your city"
                          className={`w-full rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        {errors.city && (
                          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <HiExclamationTriangle className="w-3.5 h-3.5" />{errors.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-200 mb-2">
                        Phone Number
                        {showRequired(phone, validatePhone) && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          disabled={loading}
                          placeholder="(555) 555-5555"
                          className={`w-full rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        <HiPhone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <HiExclamationTriangle className="w-3.5 h-3.5" />{errors.phone}
                        </p>
                      )}
                      {phone && !errors.phone && (
                        <p className="text-xs text-gray-400 mt-1">
                          Displays as: <span className="text-yellow-200 font-medium">{formatPhoneDisplay(phone)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Business Details ───────────────── */}
                  <div className="bg-gray-900/50 rounded-2xl p-5 sm:p-6 border border-yellow-300/10 hover:border-yellow-300/20 transition-colors">
                    <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                      <HiTag className="w-6 h-6" />
                      Business Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">Category</label>
                        <select
                          value={businessCategory}
                          onChange={handleCategoryChange}
                          disabled={loading}
                          className="w-full rounded-xl border border-gray-600 focus:border-yellow-400 bg-black text-yellow-100 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-colors"
                        >
                          <option value="">Select a category</option>
                          {BUSINESS_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-200 mb-2">
                          Business Description
                          {showRequired(description) && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <textarea
                          value={description}
                          onChange={handleDescriptionChange}
                          disabled={loading}
                          placeholder="Tell customers about your business, services, and what makes you unique..."
                          rows={5}
                          maxLength={DESCRIPTION_MAX_CHARS}
                          className={`w-full rounded-xl border ${errors.description ? 'border-red-500' : descOverLimit ? 'border-orange-500' : 'border-gray-600 focus:border-yellow-400'} bg-black text-yellow-100 px-4 py-3 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-colors resize-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        />
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            {errors.description && (
                              <p className="text-red-400 text-xs flex items-center gap-1">
                                <HiExclamationTriangle className="w-3.5 h-3.5" />{errors.description}
                              </p>
                            )}
                            {!errors.description && (
                              <p className="text-xs text-gray-400">This description helps customers understand what you offer</p>
                            )}
                          </div>
                          <span className={`text-xs font-mono tabular-nums ${descOverLimit ? 'text-red-400 font-semibold' : descCharCount > DESCRIPTION_MAX_CHARS * 0.9 ? 'text-orange-400' : 'text-gray-500'}`}>
                            {descCharCount}/{DESCRIPTION_MAX_CHARS}
                          </span>
                        </div>
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
                                    onChange={() => handleTagToggle(opt)}
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
            
            {/* ── Sidebar ───────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Preview Toggle */}
                <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-6">
                  <div className="text-center">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 active:scale-[0.98] transition-all border border-blue-500/20 w-full justify-center"
                    >
                      <HiGlobeAlt className="w-5 h-5" />
                      <span className="font-medium">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                    <p className="text-yellow-300 text-sm mt-3">See how customers view your business</p>
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
                        <div className="text-yellow-200 text-sm mt-2 flex flex-col items-start">
                          {address && <span className="flex items-center gap-1 leading-tight"><HiMapPin className="w-4 h-4 text-yellow-300" />{address}</span>}
                          {city && <span className="leading-tight text-yellow-200/90 mt-0.5 ml-5">{city}</span>}
                        </div>
                      )}
                      {phone && !errors.phone && (
                        <p className="text-yellow-200 text-sm mt-2 flex items-center gap-1">
                          <HiPhone className="w-4 h-4 text-yellow-300" />{formatPhoneDisplay(phone)}
                        </p>
                      )}
                      {description && (
                        <p className="text-yellow-200 text-sm mt-3 line-clamp-3">{description}</p>
                      )}
                      {ownershipTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {ownershipTags.map((tag, i) => (
                            <span key={i} className="text-xs bg-yellow-900 text-yellow-200 px-2 py-1 rounded-full">{tag}</span>
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
                    <p className="text-yellow-300 text-sm mt-2">{isPublished ? 'Visible to customers' : 'Hidden from public'}</p>
                  </div>

                  <div className="bg-black/90 border border-yellow-300/20 rounded-2xl p-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${dirty ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
                      {dirty ? <HiExclamationTriangle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                      <span className="font-medium">{dirty ? 'Unsaved Changes' : 'Saved'}</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-2">{dirty ? "Don't forget to save" : 'All changes saved'}</p>
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
                    {/* Publish / Unpublish */}
                    <button
                      onClick={handleTogglePublish}
                      disabled={loading}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isPublished
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] shadow-lg'} flex items-center justify-center gap-2`}
                    >
                      {loading ? <HiArrowPath className="w-5 h-5 animate-spin" /> : isPublished ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                      {isPublished ? 'Hide from Public' : 'Make Public'}
                    </button>

                    {/* Save */}
                    <button
                      onClick={handleSave}
                      disabled={!dirty || hasErrors || loading}
                      className={`w-full px-4 py-3 rounded-xl bg-yellow-400 text-black font-semibold transition-all ${
                        (!dirty || loading || hasErrors)
                          ? 'opacity-70 cursor-not-allowed'
                          : 'hover:scale-[1.02] active:scale-[0.98] hover:bg-yellow-300 shadow-lg'
                      } flex items-center justify-center gap-2`}
                    >
                      {loading ? <HiArrowPath className="w-5 h-5 animate-spin" /> : <HiCheckCircle className="w-5 h-5" />}
                      Save & Publish
                    </button>

                    {/* Discard Changes */}
                    {dirty && savedSnapshot.current && (
                      <button
                        onClick={handleDiscard}
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-gray-800 text-yellow-200 hover:bg-gray-700 active:scale-[0.98] transition-all border border-gray-600 flex items-center justify-center gap-2"
                      >
                        <HiArrowUturnLeft className="w-4 h-4" />
                        Discard Changes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </main>
      </PageShell>
    </>
  );
}