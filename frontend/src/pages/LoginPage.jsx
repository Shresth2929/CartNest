import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInternalRedirect } from '../utils/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = getInternalRedirect(searchParams.get('redirect'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res?.success) {
      navigate(redirect);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white rounded-3xl border border-charcoal-100 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-forest-700 text-cream-50 flex items-center justify-center font-bold text-lg mx-auto mb-3 shadow-xs">
            CN
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-charcoal-500">Sign in to your CartNest customer account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="login-email" className="font-semibold text-charcoal-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="font-semibold text-charcoal-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                id="login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 rounded-full font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? 'Authenticating...' : <>Sign In <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-charcoal-100 text-xs text-charcoal-500">
          Don't have an account yet?{' '}
          <Link to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-forest-700 hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
