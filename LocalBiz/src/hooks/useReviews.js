import { useState, useCallback } from 'react';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5236';

export default function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async (businessId) => {
    if (!businessId) return setReviews([]);
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Reviews/business/${encodeURIComponent(businessId)}`);
      if (!res.ok) { setReviews([]); setError('Failed to fetch reviews'); return; }
      const json = await res.json();
      setReviews(json);
    } catch (e) {
      setError(String(e)); setReviews([]);
    } finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async (businessId) => {
    if (!businessId) return setStats({ totalReviews: 0, averageRating: 0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } });
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/Reviews/stats/${encodeURIComponent(businessId)}`);
      if (!res.ok) { setStats({ totalReviews: 0, averageRating: 0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } }); setError('Failed to fetch review stats'); return; }
      const j = await res.json();
      setStats(j);
    } catch (e) {
      setStats({ totalReviews: 0, averageRating: 0, starBreakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 } }); setError(String(e));
    } finally { setLoading(false); }
  }, []);

  const postReview = useCallback(async (payload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      const res = await fetch(`${API_BASE}/api/Reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Post review failed');
      }
      return true;
    } catch (e) {
      throw e;
    }
  }, []);

  return { reviews, stats, loading, error, fetchReviews, fetchStats, setReviews, setStats, postReview };
}
