import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-cream-100 border-t border-charcoal-200 mt-20 text-charcoal-700">
      {/* Value Propositions */}
      <div className="border-b border-charcoal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-charcoal-200 flex items-center justify-center text-forest-700 flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-charcoal-900 text-sm">Free Standard Shipping</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">Complimentary delivery across India on orders above ₹1,500.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-charcoal-200 flex items-center justify-center text-forest-700 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-charcoal-900 text-sm">Authentic Craftsmanship</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">Ethically sourced solid woods, ceramics, and organic botanicals.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-charcoal-200 flex items-center justify-center text-forest-700 flex-shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-charcoal-900 text-sm">Simple Cancellations</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">1-click order cancellation with instantaneous inventory restoration.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-forest-700 text-cream-50 flex items-center justify-center font-bold text-sm">
              CN
            </div>
            <span className="font-bold text-lg text-charcoal-900 tracking-tight">CartNest.</span>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Mindful everyday essentials for work, dining, and tranquil living. Built with clean engineering standards and authentic craft.
          </p>
          <p className="text-xs text-forest-700 font-medium">
            Bengaluru, Karnataka, India
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider mb-4">Explore the Shop</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/shop" className="hover:text-forest-700 transition">All Products</Link></li>
            <li><Link to="/shop?sortBy=newest" className="hover:text-forest-700 transition">New Arrivals</Link></li>
            <li><Link to="/shop?sortBy=featured" className="hover:text-forest-700 transition">Featured Finds</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider mb-4">Account &amp; Orders</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/cart" className="hover:text-forest-700 transition">Shopping Bag</Link></li>
            <li><Link to="/orders" className="hover:text-forest-700 transition">Track Your Orders</Link></li>
            <li><Link to="/profile" className="hover:text-forest-700 transition">Saved Addresses</Link></li>
            <li><Link to="/login" className="hover:text-forest-700 transition">Customer Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider mb-4">CartNest</h4>
          <p className="text-xs text-charcoal-500 mb-3 leading-relaxed">
            Thoughtful finds for home, work and everything in between.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-charcoal-200 rounded-full text-xs font-semibold text-charcoal-700">
            <span className="w-2 h-2 rounded-full bg-forest-600" />
            Made for everyday living
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-charcoal-200 py-6 text-center text-xs text-charcoal-500">
        <p className="flex items-center justify-center gap-1">
          &copy; {new Date().getFullYear()} CartNest Technologies. Crafted with <Heart className="w-3.5 h-3.5 text-forest-700 fill-forest-700" /> for the E-Commerce Platform project.
        </p>
      </div>
    </footer>
  );
}
