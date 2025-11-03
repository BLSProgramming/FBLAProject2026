import { Link } from 'react-router-dom';
import { FaForumbee } from 'react-icons/fa';

export default function PublicNavbar({ 
  showHome = true, 
  showContact = true, 
  showSignIn = true, 
  showGetStarted = true 
}) {
  return (
    <nav className="bg-black border-b border-yellow-400/20 px-6 py-4 relative z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <FaForumbee className="w-8 h-8 text-yellow-400" />
          <h1 className="text-2xl font-bold text-yellow-400">
            Biz-Buzz Local Business Hub
          </h1>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          {showHome && (
            <Link 
              to="/"
              className="text-yellow-200 hover:text-yellow-400 transition-colors font-medium"
            >
              Home
            </Link>
          )}
          {showContact && (
            <Link 
              to="/contact"
              className="text-yellow-200 hover:text-yellow-400 transition-colors font-medium"
            >
              Contact Us
            </Link>
          )}
          {showSignIn && (
            <Link 
              to="/login"
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
            >
              Sign In
            </Link>
          )}
          {showGetStarted && (
            <Link 
              to="/userRegister"
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}