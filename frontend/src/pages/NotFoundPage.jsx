import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center font-bold text-2xl text-forest-800 mx-auto">
        404
      </div>
      <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Page Not Found</h1>
      <p className="text-xs text-charcoal-500 leading-relaxed">
        The mindful space or product page you were seeking may have been moved or is temporarily unavailable.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full text-xs font-semibold transition"
        >
          <Home className="w-4 h-4" /> Return to Homepage
        </Link>
      </div>
    </div>
  );
}
