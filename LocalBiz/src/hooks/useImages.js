import { useState, useCallback } from 'react';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5236';

export default function useImages({ slug = null, userId = null } = {}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImages = useCallback(async (opts = {}) => {
    const { overrideUserId = null, overrideSlug = null } = opts;
    const uid = overrideUserId ?? userId;
    const s = overrideSlug ?? slug;
    setLoading(true);
    setError(null);
    try {
      // If slug provided try to resolve business id then fetch images
      if (s) {
        const res = await fetch(`${API_BASE}/api/ManageBusiness/slug/${encodeURIComponent(s)}`);
        if (res.ok) {
          const data = await res.json();
          const businessId = data?.businessUserId ?? data?.businessUser ?? data?.id ?? data?.Id;
          if (businessId) {
            const r2 = await fetch(`${API_BASE}/api/ManageBusiness/images/${encodeURIComponent(businessId)}`);
            if (r2.ok) {
              const list = await r2.json();
              setImages(list.map(it => ({ url: it.Url || it.url || '', altText: it.AltText || it.altText || '', isPrimary: !!it.IsPrimary })));
              return;
            }
          }
        }
      }

      // Fallback: use userId
      if (uid) {
        const r = await fetch(`${API_BASE}/api/ManageBusiness/images/${encodeURIComponent(uid)}`);
        if (!r.ok) {
          setImages([]);
          setError('Failed to load images');
          return;
        }
        const json = await r.json();
        setImages(json.map(it => ({ url: it.Url || it.url || '', altText: it.AltText || it.altText || '', isPrimary: !!it.IsPrimary })));
        return;
      }

      setImages([]);
      setError('No identifier provided');
    } catch (e) {
      setError(String(e));
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [slug, userId]);

  const uploadFile = useCallback(async (file) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const form = new FormData();
    form.append('file', file, file.name);
    const res = await fetch(`${API_BASE}/api/ManageBusiness/upload-image`, { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || 'Upload failed');
    }
    const data = await res.json();
    // server returns { path }
    return data.path || data.pathUrl || data.url || data.path;
  }, []);

  const uploadFiles = useCallback(async (files = []) => {
    const uploaded = [];
    for (const f of files) {
      try {
        const path = await uploadFile(f);
        if (path) uploaded.push({ url: path, altText: '', isPrimary: false });
      } catch (e) {
        // swallow individual file errors but continue
        console.warn('uploadFiles: file upload failed', e);
      }
    }
    if (uploaded.length > 0) setImages(prev => [...prev, ...uploaded]);
    return uploaded;
  }, [uploadFile]);

  const saveImages = useCallback(async (list = [], overrideUserId = null) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const id = overrideUserId ?? userId;
    if (!id) throw new Error('No user/business id for saving images');
    const payload = list.map((it, i) => ({ Url: it.url, AltText: it.altText || '', SortOrder: i, IsPrimary: !!it.isPrimary }));
    const res = await fetch(`${API_BASE}/api/ManageBusiness/images/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Save failed');
    }
    await fetchImages();
    return true;
  }, [userId, fetchImages]);

  return { images, setImages, loading, error, fetchImages, uploadFile, uploadFiles, saveImages };
}
