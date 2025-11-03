import { Link } from "react-router-dom";
import HoneycombBackground from './HoneycombBackground';
import PublicNavbar from './PublicNavbar';

export default function RegistrationLayout({ 
  title, 
  subtitle = "Join the Buzz!", 
  children, 
  backToLogin = true 
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-black">
      <PublicNavbar showSignIn={false} showGetStarted={false} />
      <div className="flex items-center justify-center min-h-screen pt-20">
        <HoneycombBackground />

      <div className="relative z-10 w-full max-w-2xl bg-black rounded-2xl shadow-xl p-10 border-4 border-yellow-400">
        {backToLogin && (
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-1 border border-yellow-400 text-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-400 hover:text-black transition"
            >
              🔙 Back to Login
            </Link>
          </div>
        )}

        <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-2 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-center text-yellow-200 mb-6 text-sm">
          {subtitle}
        </p>

        {children}
      </div>
      </div>
    </div>
  );
}