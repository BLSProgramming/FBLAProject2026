import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function ManageBusinessNavbar({ active, onChange, links } = {}) {
  const location = useLocation();
  const navLinks = links ?? [
    { key: "manageBusiness", to: "/manageBusiness", label: "Business Page" },
    { key: "manageReviews", to: "/manageReviews", label: "Reviews" },
    { key: "manageImages", to: "/manageImages", label: "Images" },
    { key: "manageOffers", to: "/manageOffers", label: "Special Offers" },
  ];

  const renderNavLink = (link) => {

    const isActive = active === link.key || (location && typeof location.pathname === 'string' && location.pathname.startsWith(link.to));
    return (
      <Link
        key={link.to}
        to={link.to}
        onClick={() => onChange && onChange(link.key)}
        className={`px-4 py-2 rounded-md text-base md:text-lg font-semibold transition-colors duration-150 ${
          isActive 
            ? 'bg-yellow-400 text-black' 
            : 'text-yellow-200 hover:bg-yellow-600/20 hover:text-yellow-100'
        }`}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Business Management Navigation"
      className="fixed top-0 left-0 right-0 h-16 bg-black text-yellow-200 z-[9998] shadow-md"
      role="navigation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
        <div className="flex items-center gap-6">
          <span className="text-xl md:text-2xl font-extrabold">Business Management Navigation</span>
        </div>

        <div className="flex items-center gap-4">
          {navLinks.map(renderNavLink)}
        </div>
      </div>
    </nav>
  );
}