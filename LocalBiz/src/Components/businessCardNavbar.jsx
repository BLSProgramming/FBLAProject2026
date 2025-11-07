import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { businessAPI } from '../utils/api';
import { logger } from '../utils/helpers';

export default function BusinessCardNavbar({ active, onChange, slug, businessName }) {
  const [resolvedName, setResolvedName] = useState(businessName || '');
  const [loadingName, setLoadingName] = useState(false);

  useEffect(() => {
    // if a businessName prop is supplied, prefer it
    if (businessName) {
      setResolvedName(businessName);
      return;
    }
    if (!slug) return;
    
    let mounted = true;
    setLoadingName(true);
    
    // Fetch business info using API service
    const fetchBusinessName = async () => {
      try {
        const data = await businessAPI.getCard(slug);
        if (!mounted) return;
        
        const name = data && (data.businessName || data.BusinessName || data.business || data.name);
        if (name) {
          setResolvedName(name);
          return;
        }
        
        // fallback: fetch the cards list and try to match slug
        const list = await businessAPI.getCards();
        if (!mounted) return;
        
        if (Array.isArray(list)) {
          const found = list.find(item => {
            const s = (item.slug || item.Slug || '').toString();
            return s === slug;
          });
          if (found) {
            const foundName = found.businessName || found.BusinessName || found.business || found.name;
            if (foundName) { 
              setResolvedName(foundName); 
              return; 
            }
          }
        }
        // nothing found
        setResolvedName('');
      } catch (error) {
        if (!mounted) return;
        logger.error('Error fetching business name:', error);
        setResolvedName('');
      } finally {
        if (mounted) setLoadingName(false);
      }
    };
    
    fetchBusinessName();
    return () => { mounted = false; };
  }, [slug, businessName]);
  const btn = (key, label, to) => {
    if (to) {
      return (
        <Link to={to} onClick={() => onChange && onChange(key)} className={`px-6 py-3 rounded-md text-lg font-semibold transition-colors duration-150 ${active===key ? 'bg-yellow-400 text-black' : 'text-yellow-100 hover:bg-yellow-600/20'}`}>
          {label}
        </Link>
      );
    }
    return (
      <button
        onClick={() => onChange && onChange(key)}
        className={`px-6 py-3 rounded-md text-lg font-semibold transition-colors duration-150 ${active===key ? 'bg-yellow-400 text-black' : 'text-yellow-100 hover:bg-yellow-600/20'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-black/95 border-b border-yellow-300/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
          <div className="text-yellow-100 font-bold text-xl">
            {resolvedName ? resolvedName : (loadingName ? 'Loading...' : (slug ? `Card: ${slug}` : 'Business Card'))}
          </div>
        </div>
          <div className="flex items-center gap-3">
          {btn('info', 'Business Information', slug ? `/cards/${encodeURIComponent(slug)}` : '/cards')}
          {btn('reviews', 'Reviews', slug ? `/cards/${encodeURIComponent(slug)}/reviews` : '/cards')}
          {btn('deals', 'Specials/Deals', slug ? `/cards/${encodeURIComponent(slug)}/deals` : '/cards')}
          {btn('images', 'Images', slug ? `/cards/${encodeURIComponent(slug)}/images` : '/cards')}
        </div>
      </div>
    </div>
  );
}
