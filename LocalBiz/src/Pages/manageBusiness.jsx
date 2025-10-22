import HoneycombBackground from '../Components/HoneycombBackground';
import React, { useEffect, useState } from 'react';
import ManageBusinessNavbar from '../Components/manageBusinessNavbar';

export function ManageBusiness() {
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
            // ownership tags may be returned as an array or a CSV string from the API
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
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
  <HoneycombBackground />

      

      <main className="pt-12 relative z-10 p-6">
        <ManageBusinessNavbar active={activeTab} onChange={setActiveTab} />
        <h1 className="text-4xl font-bold text-yellow-100 text-center mb-8 mt-10">Business Card</h1>
        <div className="max-w-6xl mx-auto text-yellow-100 flex justify-center">
          <div className="relative w-full max-w-4xl bg-black/90 border border-yellow-300/20 rounded-3xl p-10 shadow-2xl">
            {loading && (
              <div className="absolute inset-0 bg-black/70 z-40 rounded-3xl flex items-center justify-center">
                <div className="text-yellow-200 text-lg font-semibold">Loading...</div>
              </div>
            )}
            <div className="mx-auto max-w-3xl">
              
              <label className="block text-sm text-yellow-200 mb-2">Business Name</label>
              <div className="relative mb-6">
                <input
                  type="text"
                  readOnly
                  value={businessName || 'Your Business Name'}
                  className="w-full rounded-lg border border-yellow-500 bg-gray-800 text-yellow-100 px-4 py-3 text-2xl font-extrabold focus:outline-none relative z-0"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-300 z-20">🔒</div>
                <div className="pointer-events-none absolute inset-0 bg-gray-900/30 rounded-lg z-10" />
              </div>

              
              <label className="block text-sm text-yellow-200 mb-2">Email</label>
              <div className="relative mb-4">
                <input
                  type="email"
                  readOnly
                  value={email || ''}
                  placeholder="you@business.com"
                  className="w-full rounded-lg border border-yellow-500 bg-gray-800 text-yellow-100 px-3 py-2 pr-12 focus:outline-none"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-300 z-20">
                  🔒
                </div>
                
                <div className="pointer-events-none absolute inset-0 bg-gray-900/30 rounded-lg" />
              </div>

              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-yellow-200 mb-2">Address{showRequired(address) && <span className="text-red-400 ml-1">*</span>}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { const v = e.target.value; setAddress(v); setDirty(true); validateAll(v, city, phone, description); }}
                    disabled={loading}
                    placeholder="Street address"
                      className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-yellow-200 mb-2">City{showRequired(city) && <span className="text-red-400 ml-1">*</span>}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { const v = e.target.value; setCity(v); setDirty(true); validateAll(address, v, phone, description); }}
                    disabled={loading}
                    placeholder="City"
                    className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-yellow-200 mb-2">Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => { setBusinessCategory(e.target.value); setDirty(true); }}
                  disabled={loading}
                  className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none"
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

              <div className="mt-4">
                <label className="block text-sm text-yellow-200 mb-2">Ownership Tags</label>
                <div className="text-xs text-yellow-300 mb-2">These options are optional — select any that apply.</div>
                <div className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none">
                  <div className="flex flex-wrap gap-2">
                    {ownershipOptions.map(opt => {
                      const selected = ownershipTags.includes(opt);
                      return (
                        <label key={opt} className={`inline-flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer ${selected ? 'bg-yellow-400 text-black' : 'bg-transparent'}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) => {
                              setDirty(true);
                              if (e.target.checked) setOwnershipTags(prev => [...prev, opt]);
                              else setOwnershipTags(prev => prev.filter(p => p !== opt));
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-yellow-200 mb-2">Phone{showRequired(phone, validatePhone) && <span className="text-red-400 ml-1">*</span>}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { const v = e.target.value; setPhone(v); setDirty(true); validateAll(address, city, v, description); }}
                  disabled={loading}
                  placeholder="(555) 555-5555"
                  className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-yellow-200 mb-2">Description{showRequired(description) && <span className="text-red-400 ml-1">*</span>}</label>
                <textarea
                  value={description}
                  onChange={(e) => { const v = e.target.value; setDescription(v); setDirty(true); validateAll(address, city, phone, v); }}
                  disabled={loading}
                  placeholder="Describe your business"
                  rows={6}
                  className={`w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-3 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>

              
              <div className="mt-4 text-sm text-yellow-200 text-right">{statusMessage}</div>
              
              <div className="mt-6 flex justify-end items-center">
                <button
                  onClick={async () => {
                    // toggle publish state: unpublish / enable
                    setStatusMessage('');
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
                        // try to surface server message
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
                      // ensure UI reflects saved DB state
                      await refreshCardState();
                    } catch (err) {
                      console.warn('toggle-publish failed', err);
                      setStatusMessage('Failed to update publish state: ' + (err?.message || String(err)));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`mr-3 px-3 py-2 rounded-md text-sm transition transform hover:-translate-y-0.5 ${isPublished ? 'bg-red-500 text-white shadow-md' : 'bg-green-400 text-black shadow-md'} font-semibold ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isPublished ? 'Disable' : 'Enable'}
                </button>

                <button
                  onClick={async () => {
                      setStatusMessage('');
                      const isValid = validateAll(address, city, phone, description);
                      if (!dirty || !isValid) return;
            try {
              setLoading(true);
                        const backendBase = 'http://localhost:5236';
                        const userId = localStorage.getItem('userId');
                        const token = localStorage.getItem('token');
                        const payload = { Id: Number(userId || 0), Address: address, City: city, Phone: phone, Description: description };
                        if (businessCategory) payload.BusinessCategory = businessCategory;
                        // Always include OwnershipTags in payload; send empty array to clear tags when none selected
                        payload.OwnershipTags = Array.isArray(ownershipTags) ? ownershipTags : [];
                        // when publishing via Save, mark IsPublished = true
                        payload.IsPublished = true;
                        const res = await fetch(backendBase + '/api/ManageBusiness/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                          body: JSON.stringify(payload),
                        });
                        const text = await res.text();
                        if (!res.ok) throw new Error(text || res.statusText);
                        setStatusMessage('Published Successfully');
                        setIsPublished(true);
                        setDirty(false);
                      } catch (err) {
                        setStatusMessage('Failed to save: ' + (err?.message || String(err)));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={!dirty || Boolean(errors.address || errors.city || errors.phone || errors.description) || loading}
                  className={`px-4 py-2 rounded-md bg-yellow-400 text-black font-semibold transition-transform transform ${(!dirty || loading) ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:scale-[1.02] shadow-lg'}`}>
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}