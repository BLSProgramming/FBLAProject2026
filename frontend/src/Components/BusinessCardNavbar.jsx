import React, { useEffect, useState } from 'react';
import TabNavbar from './TabNavbar';
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

  const encodedSlug = slug ? encodeURIComponent(slug) : '';

  const links = [
    { key: 'info',    label: 'Business Information', to: slug ? `/cards/${encodedSlug}` : '/cards' },
    { key: 'reviews', label: 'Reviews',              to: slug ? `/cards/${encodedSlug}/reviews` : '/cards' },
    { key: 'deals',   label: 'Specials/Deals',       to: slug ? `/cards/${encodedSlug}/deals` : '/cards' },
    { key: 'images',  label: 'Images',               to: slug ? `/cards/${encodedSlug}/images` : '/cards' },
  ];

  const displayTitle = resolvedName
    || (loadingName ? 'Loading...' : (slug ? `Card: ${slug}` : 'Business Card'));

  return (
    <TabNavbar
      title={displayTitle}
      ariaLabel="Business Card Navigation"
      links={links}
      active={active}
      onChange={onChange}
    />
  );
}
