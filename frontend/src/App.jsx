import React, { useState, useEffect } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API health check error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-charcoal-800">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-charcoal-100 p-8 text-center">
        <div className="w-12 h-12 bg-forest-100 text-forest-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          CN
        </div>
        <h1 className="text-2xl font-bold text-charcoal-900 mb-2">CartNest Storefront</h1>
        <p className="text-charcoal-500 text-sm mb-6">
          Phase 1 Environment &amp; Database Connected Successfully.
        </p>
        <div className="bg-cream-100 rounded-lg p-4 text-left text-xs font-mono">
          <p className="font-semibold text-charcoal-700 mb-1">Backend Health Check:</p>
          {loading ? (
            <p className="text-charcoal-400">Pinging /api/health...</p>
          ) : health ? (
            <pre className="text-forest-700">{JSON.stringify(health, null, 2)}</pre>
          ) : (
            <p className="text-red-500">Failed to connect to backend API.</p>
          )}
        </div>
      </div>
    </div>
  );
}
