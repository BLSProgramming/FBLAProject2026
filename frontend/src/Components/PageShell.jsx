import React from 'react';
import HoneycombBackground from './HoneycombBackground';
import PageTransition from './PageTransition';

/**
 * Standard page wrapper combining the gradient backdrop, honeycomb pattern,
 * and entrance animation.  Covers the dominant layout pattern used across
 * dashboard, manage-* pages, card-* pages, etc.
 *
 * @param {React.ReactNode} children      – Page content
 * @param {number}  opacity               – HoneycombBackground opacity (default 0.12)
 * @param {string}  gradient              – Tailwind gradient classes (from-* via-* to-*)
 * @param {string}  className             – Extra classes for the outer wrapper
 * @param {string}  transitionType        – PageTransition animation type
 */
export default function PageShell({
  children,
  opacity = 0.12,
  gradient = 'from-yellow-400 via-yellow-500 to-black',
  className = '',
  transitionType = 'fade-up',
}) {
  return (
    <div className={`relative min-h-screen w-full ${className}`}>
      <div className={`fixed inset-0 bg-gradient-to-br ${gradient} z-0`} />
      <HoneycombBackground opacity={opacity} />
      <PageTransition type={transitionType}>
        {children}
      </PageTransition>
    </div>
  );
}
