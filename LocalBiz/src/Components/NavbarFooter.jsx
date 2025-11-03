import React from 'react';
import { Link } from 'react-router-dom';
import { FaGear } from 'react-icons/fa6';
import { FaLongArrowAltRight } from 'react-icons/fa';

export default function NavbarFooter({ onLogout, settingsPath = '/settings' }) {
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
    } catch {}
    if (typeof onLogout === 'function') onLogout();
  };

  return (
    <div className="px-3 pb-4">
      <div className="border-t border-yellow-800 mb-3" />
      <div className="pt-1 pl-6">
        <Link 
          to={settingsPath} 
          className="flex items-center gap-2 px-4 py-1 rounded-md hover:bg-yellow-400 hover:text-black transition text-sm"
        >
          <FaGear className="w-4 h-4 text-yellow-200" />
          Settings
        </Link>

        <Link 
          onClick={handleLogout} 
          to="/login" 
          className="mt-2 w-full text-left flex items-center gap-2 px-4 py-1 rounded-md hover:bg-yellow-400 hover:text-black transition text-sm"
        >
          <FaLongArrowAltRight className="w-4 h-4 text-yellow-200" />
          Logout
        </Link>
      </div>
    </div>
  );
}