import React from 'react';
import honeycomb from '../assets/honeycomb.png';

export default function HoneycombBackground({ opacity = 0.10, className = '' }) {
  return (
    <img
      src={honeycomb}
      alt=""
      role="presentation"
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full object-cover pointer-events-none z-0 ${className}`}
      style={{ opacity }}
    />
  );
}
