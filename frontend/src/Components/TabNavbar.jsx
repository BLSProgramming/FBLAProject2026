import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Shared tab navigation bar used by both management and public card pages.
 *
 * @param {string}   title        – Text shown on the left side of the navbar
 * @param {Array}    links        – Array of { key, label, to } tab descriptors
 * @param {string}   active       – Currently active tab key
 * @param {Function} onChange     – Called with the tab key when a tab is clicked
 * @param {string}   ariaLabel    – Accessible label for the <nav>
 * @param {React.ReactNode} titleSlot – Optional custom JSX to replace the title text
 */
export default function TabNavbar({
  title = '',
  links = [],
  active,
  onChange,
  ariaLabel = 'Navigation',
  titleSlot,
}) {
  const location = useLocation();

  return (
    <nav
      aria-label={ariaLabel}
      role="navigation"
      className="fixed inset-x-0 top-0 z-[9998] h-16 bg-black/95 border-b border-yellow-300/20 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
        {/* Left: title or custom slot */}
        <div className="flex items-center gap-4">
          {titleSlot ?? (
            <span className="text-yellow-100 font-bold text-xl truncate max-w-xs">
              {title}
            </span>
          )}
        </div>

        {/* Right: tab links */}
        <div className="flex items-center gap-3">
          {links.map((link) => {
            const isActive =
              active === link.key ||
              (location &&
                typeof location.pathname === 'string' &&
                location.pathname.startsWith(link.to));

            return (
              <Link
                key={link.key}
                to={link.to}
                onClick={() => onChange?.(link.key)}
                className={`px-4 py-2 rounded-md text-base md:text-lg font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-100 hover:bg-yellow-600/20'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
