import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BusinessCardNavbar from '../Components/businessCardNavbar';
import honeycomb from '../assets/honeycomb.png';

export default function CardImages() {
  const { slug } = useParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (slug) {
          const res = await fetch(`http://localhost:5236/api/ManageBusiness/slug/${encodeURIComponent(slug)}`);
          if (res.ok) {
            const txt = await res.text();
            let data = null;
            try { data = JSON.parse(txt); } catch { /* ignore */ }
            if (data && (data.businessUserId || data.businessUser || data.id || data.Id)) {
              const businessId = data.businessUserId || data.businessUser || data.id || data.Id;
              const r2 = await fetch(`http://localhost:5236/api/ManageBusiness/images/${encodeURIComponent(businessId)}`);
              if (r2.ok) {
                const list = await r2.json();
                if (!mounted) return;
                setImages(list.map((it) => ({ url: it.Url || it.url || '', alt: it.AltText || it.altText || '', isPrimary: !!it.IsPrimary })));
                return;
              }
            }
          }
        }

        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        if (!userId) { setError('No business selected'); setImages([]); return; }
        const r = await fetch(`http://localhost:5236/api/ManageBusiness/images/${encodeURIComponent(userId)}`);
        if (!r.ok) { setError('Failed to load images'); setImages([]); return; }
        const json = await r.json();
        if (!mounted) return;
        setImages(json.map((it) => ({ url: it.Url || it.url || '', alt: it.AltText || it.altText || '', isPrimary: !!it.IsPrimary })));
      } catch (err) {
        if (!mounted) return;
        setError('Error loading images');
        setImages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-black text-yellow-100 relative">
      <img src={honeycomb} alt="Honeycomb" className="fixed inset-0 opacity-10 w-full h-full object-cover pointer-events-none z-0" />
      <div className="relative z-10">
        <BusinessCardNavbar active="images" slug={slug} />

        <main className="pt-20 max-w-6xl mx-auto px-4 mt-6">
          <div className="bg-black/80 rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-2 text-center">Gallery</h1>
            <p className="text-sm text-yellow-300 mb-4 text-center">Images uploaded for this business. Click to preview.</p>

            {loading && <div className="text-yellow-200">Loading images...</div>}
            {error && <div className="text-red-400">{error}</div>}

            {!loading && images.length === 0 && !error && (
              <div className="text-yellow-200">No images uploaded yet.</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative bg-gray-900 rounded-md overflow-hidden group">
                  <button onClick={() => setPreview(img.url)} className="w-full h-40 overflow-hidden block">
                    <img src={img.url} alt={img.alt || `image-${idx}`} className="w-full h-full object-cover transform group-hover:scale-105 transition" />
                  </button>
                  {img.isPrimary && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">Primary</div>
                  )}
                </div>
              ))}
            </div>

            {/* Preview modal */}
            {preview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
                <div className="max-w-4xl w-full rounded overflow-hidden">
                  <img src={preview} alt="preview" className="w-full h-auto object-contain bg-black rounded" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
