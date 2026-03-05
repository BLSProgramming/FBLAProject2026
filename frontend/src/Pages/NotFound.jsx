import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-yellow-400 mb-4">404</h1>
        <p className="text-xl text-yellow-200 mb-6">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
