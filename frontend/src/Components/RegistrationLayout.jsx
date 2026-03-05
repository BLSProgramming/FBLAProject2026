import { Link } from "react-router-dom";
import { HiArrowLeft } from 'react-icons/hi2';
import PageShell from './PageShell';
import PublicNavbar from './PublicNavbar';

export default function RegistrationLayout({ 
  title, 
  subtitle = "Join the Buzz!",
  subtitleIcon,
  children, 
  backToLogin = true 
}) {
  return (
    <PageShell>
      <PublicNavbar showSignIn={false} showGetStarted={false} />
        <div className="flex items-center justify-center min-h-screen pt-20">

      <div className="relative z-10 w-full max-w-2xl bg-black rounded-2xl shadow-xl p-10 border-4 border-yellow-400">
        {backToLogin && (
          <div className="mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-1 border border-yellow-400 text-yellow-400 rounded-md text-sm font-medium hover:bg-yellow-400 hover:text-black transition"
            >
              <HiArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        )}

        <h1 className="text-4xl font-extrabold text-center text-yellow-400 mb-2 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-center text-yellow-200 mb-6 text-sm inline-flex items-center justify-center gap-1 w-full">
          {subtitleIcon} {subtitle}
        </p>

        {children}
      </div>
        </div>
    </PageShell>
  );
}