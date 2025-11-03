import { Link } from 'react-router-dom';
import { FaForumbee, FaSearch, FaHandshake, FaStar, FaUsers, FaShieldAlt } from 'react-icons/fa';
import { HiSparkles, HiBuildingOffice2 } from 'react-icons/hi2';
import HoneycombBackground from '../Components/HoneycombBackground';
import PublicNavbar from '../Components/PublicNavbar';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative">
      <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none z-0" />
      <HoneycombBackground opacity={0.08} />
      
      
      <PublicNavbar showHome={false} />

      {/* Hero Section */}
      <section className="relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                  Discover the
                  <span className="text-yellow-400 block">
                    Local Buzz
                  </span>
                </h2>
                <p className="text-xl text-yellow-200 leading-relaxed">
                  Connect with amazing local businesses in your community. Find the perfect place to eat, shop, and explore while supporting your neighborhood entrepreneurs.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/userRegister"
                  className="border-2 border-yellow-400 text-yellow-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 hover:text-black transition-all duration-200 text-center"
                >
                  🐝 Join as Explorer
                </Link>
                <Link 
                  to="/businessRegister"
                  className="border-2 border-yellow-400 text-yellow-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 hover:text-black transition-all duration-200 text-center"
                >
                  🏢 List Your Business
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-8 space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <HiSparkles className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-2xl font-bold text-yellow-400">Why Biz-Buzz?</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <FaSearch className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Discover Local Gems</h4>
                      <p className="text-yellow-200 text-sm">Find hidden treasures in your neighborhood</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <FaHandshake className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Support Local Economy</h4>
                      <p className="text-yellow-200 text-sm">Help small businesses thrive in your community</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <FaStar className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Share Your Experience</h4>
                      <p className="text-yellow-200 text-sm">Leave reviews and help others make great choices</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <FaUsers className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-semibold">Connect with Community</h4>
                      <p className="text-yellow-200 text-sm">Build relationships with local business owners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Explore Local Business
            </h3>
            <p className="text-xl text-yellow-200">
              Powerful features designed for both customers and business owners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <FaSearch className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Smart Discovery</h4>
              <p className="text-yellow-200">
                Find exactly what you're looking for with our intelligent search and filtering system.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <HiBuildingOffice2 className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Business Profiles</h4>
              <p className="text-yellow-200">
                Comprehensive business cards with photos, offers, reviews, and contact information.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <FaStar className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Reviews & Ratings</h4>
              <p className="text-yellow-200">
                Share honest feedback and discover what others love about local businesses.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <FaHandshake className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Special Offers</h4>
              <p className="text-yellow-200">
                Discover exclusive deals and promotions from your favorite local businesses.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <FaUsers className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Community Driven</h4>
              <p className="text-yellow-200">
                Built by the community, for the community. Real people, real experiences.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/20 rounded-xl p-8 hover:border-yellow-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
                <FaShieldAlt className="text-black text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Secure & Trusted</h4>
              <p className="text-yellow-200">
                Your data is protected with enterprise-level security and privacy controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400/10 to-yellow-600/5 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Explore Your Local Business Community?
          </h3>
          <p className="text-xl text-yellow-200 mb-10">
            Join thousands of users already discovering amazing local businesses in their neighborhoods.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/userRegister"
              className="border-2 border-yellow-400 text-yellow-400 px-10 py-4 rounded-lg font-bold text-xl hover:bg-yellow-400 hover:text-black transition-all duration-200"
            >
              🚀 Start Exploring Now
            </Link>
            <Link 
              to="/login"
              className="border-2 border-yellow-400 text-yellow-400 px-10 py-4 rounded-lg font-bold text-xl hover:bg-yellow-400 hover:text-black transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-yellow-400/20 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <FaForumbee className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold">Biz-Buzz Local Business Hub</span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-yellow-200 hover:text-yellow-400 transition-colors">
                Privacy Policy
              </button>
              <button className="text-yellow-200 hover:text-yellow-400 transition-colors">
                Terms of Service
              </button>
              <Link to="/contact" className="text-yellow-200 hover:text-yellow-400 transition-colors">
                Contact Us
              </Link>

            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-yellow-400/10">
            <p className="text-yellow-200 text-sm">
              © 2025 Biz-Buzz Local Business Hub. Built with ❤️ for local communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}