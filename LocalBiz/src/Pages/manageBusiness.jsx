import honeycomb from '../assets/honeycomb.png';
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
  const [dirty, setDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('manageBusiness');
  const [errors, setErrors] = useState({ address: '', city: '', phone: '', description: '' });
  const [isPublished, setIsPublished] = useState(true);

  const validatePhone = (value) => {
    // strip non-digits
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

 
  React.useEffect(() => {
    if (!statusMessage) return;
    if (statusMessage === 'Published Successfully') {
      const t = setTimeout(() => setStatusMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [statusMessage]);

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

    const fetchBusiness = async () => {
      setLoading(true);
      try {
        const backendBase = 'http://localhost:5236';
        const res = await fetch(backendBase + '/api/BusinessRegistration/all', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const contentType = res.headers.get('content-type') || '';
        const textBody = await res.text();
        if (!res.ok) throw new Error('Failed to fetch: ' + res.status + '\n' + textBody.slice(0, 1000));
        if (!contentType.includes('application/json')) throw new Error('Expected JSON but received: ' + contentType);

        const list = JSON.parse(textBody);
        let found = list.find(b => String(b.Id) === String(userId) || String(b.id) === String(userId));
        if (found) {
          const name = found.BusinessName || found.businessName || found.Name || found.name || '';
          setBusinessName(name || 'Your Business');
          const e = found.Email || found.email || found.EmailAddress || found.emailAddress || '';
          if (e) setEmail(e);
          const cat = found.BusinessCategory || found.businessCategory || '';
          if (cat) setBusinessCategory(cat);
          
          try {
            const cardsRes = await fetch('http://localhost:5236/api/ManageBusiness/cards');
            if (cardsRes.ok) {
              const list = await cardsRes.json();
              const myCard = list.find(bc => String(bc.BusinessUserId || bc.Id) === String(userId) || String(bc.Id) === String(userId));
              if (myCard && typeof myCard.IsPublished !== 'undefined') setIsPublished(Boolean(myCard.IsPublished));
            }
          } catch (cardsErr) {
            console.debug('Failed to fetch manage business cards', cardsErr);
          }
          return;
        }

        fallbackFromLocal();
      } catch (err) {
        
        console.warn('fetchBusiness failed', err);

        fallbackFromLocal();
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, []);
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="absolute inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />

      

      <main className="pt-12 relative z-10 p-6">
        <ManageBusinessNavbar active={activeTab} onChange={setActiveTab} />
        <h1 className="text-4xl font-bold text-yellow-100 text-center mb-8 mt-10">Business Card</h1>
        <div className="max-w-6xl mx-auto text-yellow-100 flex justify-center">
          <div className="w-full max-w-4xl bg-black/90 border border-yellow-300/20 rounded-3xl p-10 shadow-2xl">
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
                <div className="absolute inset-y-0 right-3 flex items-center text-gray-300">
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
                    placeholder="Street address"
                    className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-yellow-200 mb-2">City{showRequired(city) && <span className="text-red-400 ml-1">*</span>}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { const v = e.target.value; setCity(v); setDirty(true); validateAll(address, v, phone, description); }}
                    placeholder="City"
                    className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm text-yellow-200 mb-2">Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => { setBusinessCategory(e.target.value); setDirty(true); }}
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
                <label className="block text-sm text-yellow-200 mb-2">Phone{showRequired(phone, validatePhone) && <span className="text-red-400 ml-1">*</span>}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { const v = e.target.value; setPhone(v); setDirty(true); validateAll(address, city, v, description); }}
                  placeholder="(555) 555-5555"
                  className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm text-yellow-200 mb-2">Description{showRequired(description) && <span className="text-red-400 ml-1">*</span>}</label>
                <textarea
                  value={description}
                  onChange={(e) => { const v = e.target.value; setDescription(v); setDirty(true); validateAll(address, city, phone, v); }}
                  placeholder="Describe your business"
                  rows={6}
                  className="w-full rounded-lg border border-yellow-500 bg-black text-yellow-100 px-3 py-3 focus:outline-none"
                />
              </div>

              
              <div className="mt-4 text-sm text-yellow-200 text-right">{statusMessage}</div>
              
              <div className="mt-6 flex justify-end items-center">
                <button
                  onClick={async () => {
                    // toggle publish state: unpublish / enable
                    try {
                      const backendBase = 'http://localhost:5236';
                      const userId = localStorage.getItem('userId');
                      const token = localStorage.getItem('token');
                      const publish = !isPublished;
                      const res = await fetch(`${backendBase}/api/ManageBusiness/toggle-publish/${userId}?publish=${publish}`, {
                        method: 'POST',
                        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
                      });
                      if (!res.ok) throw new Error(await res.text());
                      const data = await res.json();
                      setIsPublished(Boolean(data.isPublished));
                      setStatusMessage(data.message || 'Updated');
                    } catch (err) {
                      console.warn('toggle-publish failed', err);
                      setStatusMessage('Failed to update publish state');
                    }
                  }}
                  className={`mr-3 px-3 py-2 rounded-md text-sm transition transform hover:-translate-y-0.5 ${isPublished ? 'bg-red-500 text-white shadow-md' : 'bg-green-400 text-black shadow-md'} font-semibold`}
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
                  className={`px-4 py-2 rounded-md bg-yellow-400 text-black font-semibold ${(!dirty || loading) ? 'opacity-70 cursor-not-allowed' : ''}`}>
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