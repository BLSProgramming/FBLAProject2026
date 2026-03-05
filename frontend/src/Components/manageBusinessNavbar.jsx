import React from 'react';
import TabNavbar from './TabNavbar';

const DEFAULT_LINKS = [
  { key: 'manageBusiness', to: '/manageBusiness', label: 'Business Page' },
  { key: 'manageReviews', to: '/manageReviews', label: 'Reviews' },
  { key: 'manageImages', to: '/manageImages', label: 'Images' },
  { key: 'manageOffers', to: '/manageOffers', label: 'Special Offers' },
];

export default function ManageBusinessNavbar({ active, onChange, links }) {
  return (
    <TabNavbar
      title="Business Management"
      ariaLabel="Business Management Navigation"
      links={links ?? DEFAULT_LINKS}
      active={active}
      onChange={onChange}
    />
  );
}