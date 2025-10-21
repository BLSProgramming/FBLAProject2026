import React, { useState, useEffect, useRef } from 'react';
import ManageBusinessNavbar from '../Components/manageBusinessNavbar';
import honeycomb from '../assets/honeycomb.png';
import { HiArrowSmallLeft, HiArrowSmallRight } from 'react-icons/hi2';

export default function ManageImages() {
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]); // { url, altText, isPrimary }
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [changed, setChanged] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadImages = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:5236/api/ManageBusiness/images/${encodeURIComponent(userId)}`);
      if (!res.ok) {
        // fallback to cards endpoint
        const alt = await fetch('http://localhost:5236/api/ManageBusiness/cards');
        if (!alt.ok) return;
        const list = await alt.json();
        const my = list.find(c => String(c.businessUserId || c.BusinessUserId || c.Id || c.id) === String(userId));
        if (!my) return;
        const imgs = (my.Images || my.images || []).slice ? (my.Images || my.images || []) : [];
        setImages(imgs.map((it, i) => (typeof it === 'string' ? { url: it, altText: '', isPrimary: i === 0 } : { url: it.Url || it.url || '', altText: it.AltText || it.altText || '', isPrimary: it.IsPrimary || it.isPrimary || false })));
        return;
      }
      const data = await res.json();
      setImages(data.map((it, i) => ({ url: it.Url || it.url || '', altText: it.AltText || it.altText || '', isPrimary: it.IsPrimary || false })));
      setChanged(false);
    } catch (e) {
      console.debug('loadImages failed', e);
    }
  };

  useEffect(() => { loadImages(); }, [userId]);

  const onFileChange = (e) => { setFiles(Array.from(e.target.files || [])); };

  const uploadAll = async () => {
    if (!files || files.length === 0) { if (fileInputRef && fileInputRef.current) { fileInputRef.current.click(); return; } return; }
    setLoading(true);
    const backend = 'http://localhost:5236';
    try {
      const saved = [...images];
      for (const f of files) {
        const form = new FormData();
        form.append('file', f, f.name);
        const res = await fetch(backend + '/api/ManageBusiness/upload-image', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) { console.warn('upload failed', await res.text()); continue; }
        const data = await res.json();
        if (data && data.path) saved.push({ url: data.path, altText: '', isPrimary: false });
      }
      setImages(saved); setFiles([]); setChanged(true);
    } catch (e) { console.warn('uploadAll error', e); } finally { setLoading(false); }
  };

  const removeImage = (index) => { const next = [...images]; next.splice(index, 1); if (next.length > 0 && !next.some(i => i.isPrimary)) next[0].isPrimary = true; setImages(next); setChanged(true); };

  const moveImage = (index, dir) => { const next = [...images]; const newIndex = index + dir; if (newIndex < 0 || newIndex >= next.length) return; const [item] = next.splice(index, 1); next.splice(newIndex, 0, item); setImages(next); setChanged(true); };

  // primary selection removed — keep isPrimary field in db but selection handled elsewhere

  const revertChanges = async () => { await loadImages(); setChanged(false); };

  const saveImages = async () => {
    if (!userId) return; setLoading(true);
    try {
      const imagesPayload = images.map((it, i) => ({ Url: it.url, AltText: it.altText || '', SortOrder: i, IsPrimary: !!it.isPrimary }));
      const endpoint = `http://localhost:5236/api/ManageBusiness/images/${encodeURIComponent(userId)}`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(imagesPayload) });
      if (!res.ok) { console.warn('save images failed', await res.text()); }
      else { setSuccessMessage('Images saved successfully'); setTimeout(() => setSuccessMessage(''), 3000); setChanged(false); await loadImages(); }
    } catch (e) { console.warn('saveImages error', e); } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <img src={honeycomb} alt="Honeycomb" className="fixed inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
      <div className="relative z-10 p-0 min-h-screen w-full flex flex-col items-center text-yellow-100">
        <ManageBusinessNavbar active="manageImages" onChange={() => {}} />
        <main className="w-full pt-12">
          <div className="w-full mx-auto max-w-none px-8 py-8">
            <div className="max-w-6xl mx-auto bg-black/90 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Manage Images</h2>
                  <p className="text-yellow-300">Upload and arrange images for your business card.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input ref={fileInputRef} type="file" multiple onChange={onFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 bg-yellow-400 text-black rounded-md transform transition-all duration-200 hover:scale-105 hover:shadow-md">Choose files</button>
                  <button onClick={uploadAll} disabled={loading} className={`px-3 py-2 bg-yellow-400 text-black rounded-md transform transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Upload</button>
                  <button onClick={saveImages} disabled={!changed || loading} className={`px-3 py-2 bg-green-400 text-black rounded-md transform transition-all duration-200 ${!changed || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Save changes</button>
                  <button onClick={revertChanges} disabled={!changed || loading} className={`px-3 py-2 bg-gray-700 text-yellow-100 rounded-md transform transition-all duration-200 ${!changed || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}`}>Revert</button>
                </div>
              </div>

              <div className="mb-4 text-sm text-yellow-200">{images.length} image(s). Use move buttons to reorder. Click a tile to preview.</div>

              <div className="grid grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative bg-gray-800 rounded-md overflow-hidden group">
                    <div onClick={() => setPreviewUrl(img.url)} className="w-full h-44 bg-gray-700 cursor-pointer transform transition-transform duration-300 group-hover:scale-105">
                      <img src={img.url} alt={img.altText || `image-${i}`} className="w-full h-full object-cover" />
                    </div>
                    {/* primary star removed */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button title="Move left" onClick={() => moveImage(i, -1)} className="p-1 rounded bg-black/40 text-yellow-100 hover:scale-110 transform transition"><HiArrowSmallLeft /></button>
                      <button title="Move right" onClick={() => moveImage(i, 1)} className="p-1 rounded bg-black/40 text-yellow-100 hover:scale-110 transform transition"><HiArrowSmallRight /></button>
                      <button title="Remove" onClick={() => removeImage(i)} className="p-1 rounded bg-red-600 text-white hover:scale-110 transform transition">🗑</button>
                    </div>
                    {/* overlay caption removed */}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="max-w-3xl w-full rounded shadow-lg overflow-hidden">
            <img src={previewUrl} alt="preview" className="w-full h-auto object-contain bg-black" />
          </div>
        </div>
      )}

      {/* success toast */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow-lg transition transform duration-300 ease-out opacity-100 translate-y-0">{successMessage}</div>
        </div>
      )}
    </div>
  );
}

