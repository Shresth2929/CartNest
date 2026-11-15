import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, LogOut, Package, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    api.products.categories()
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch((err) => showToast(err.message || 'Failed to load categories', 'error'));
  }, [showToast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-charcoal-100 transition-all">
      {/* Top Banner */}
      <div className="bg-forest-900 text-cream-100 text-xs py-1.5 px-4 text-center tracking-wide font-medium">
        Free standard shipping across India on mindful essentials over ₹1,500
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-forest-700 text-cream-50 flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-forest-800 transition">
              CN
            </div>
            <span className="font-bold text-xl tracking-tight text-charcoal-900 font-sans">
              CartNest<span className="text-forest-600">.</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-8 relative"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search handcrafted stands, ceramics, diffusers..."
              className="w-full bg-cream-50 text-charcoal-800 placeholder-charcoal-400 text-sm rounded-full pl-10 pr-4 py-2 border border-charcoal-200 focus:outline-none focus:border-forest-600 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 pointer-events-none" />
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-charcoal-700">
            <Link to="/" className="hover:text-forest-700 transition">Home</Link>
            <Link to="/shop" className="hover:text-forest-700 transition">Shop</Link>
            {categories.slice(0, 3).map((category) => (
              <Link key={category.id} to={`/shop?category=${category.slug}`} className="hover:text-forest-700 transition">
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Actions: Cart & Auth */}
          <div className="flex items-center gap-4">
            {/* Cart Link */}
            <Link
              to="/cart"
              className="relative p-2 text-charcoal-700 hover:text-forest-700 rounded-full hover:bg-cream-100 transition"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-forest-700 text-cream-50 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-charcoal-200 hover:border-forest-600 transition bg-cream-50"
                >
                  <span className="text-xs font-semibold text-charcoal-800 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
                </button>

                {isUserDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-charcoal-100 py-1.5 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-charcoal-100">
                      <p className="text-xs text-charcoal-500">Signed in as</p>
                      <p className="text-sm font-semibold text-charcoal-900 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal-700 hover:bg-cream-100 hover:text-forest-700 transition"
                    >
                      <Package className="w-4 h-4 text-charcoal-400" />
                      My Orders
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-charcoal-700 hover:bg-cream-100 hover:text-forest-700 transition"
                    >
                      <MapPin className="w-4 h-4 text-charcoal-400" />
                      Address Book &amp; Profile
                    </Link>

                    <div className="border-t border-charcoal-100 my-1" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-charcoal-700 hover:text-forest-700 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full transition shadow-sm"
                >
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-charcoal-700 hover:bg-cream-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-charcoal-100 py-4 space-y-4 animate-in fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-cream-50 text-charcoal-800 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-charcoal-200"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3 pointer-events-none" />
            </form>

            <div className="flex flex-col space-y-2 text-sm font-medium text-charcoal-800">
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-cream-100"
              >
                Shop all
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-cream-100"
                >
                  {category.name}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-2 border-t border-charcoal-100 flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 border border-charcoal-200 rounded-xl text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 bg-forest-700 text-cream-50 rounded-xl text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
