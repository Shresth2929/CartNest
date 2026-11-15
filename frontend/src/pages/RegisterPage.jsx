import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInternalRedirect } from '../utils/navigation';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = getInternalRedirect(searchParams.get('redirect'));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await register(formData);
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
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Join CartNest</h1>
          <p className="text-xs text-charcoal-500">Create an account for persistent carts and fast checkout</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="register-name" className="font-semibold text-charcoal-700 block mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                id="register-name"
                required
                minLength={2}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Priya Sharma"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="font-semibold text-charcoal-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                id="register-email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="font-semibold text-charcoal-700 block mb-1">Password (Min 8 characters)</label>
            <div className="relative">
              <input
                type="password"
                id="register-password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="register-phone" className="font-semibold text-charcoal-700 block mb-1">Mobile Phone (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                id="register-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
              <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-forest-700 hover:bg-forest-800 disabled:opacity-50 text-cream-50 rounded-full font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? 'Creating Account...' : <>Create Account <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-charcoal-100 text-xs text-charcoal-500">
          Already have an account?{' '}
          <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-forest-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
