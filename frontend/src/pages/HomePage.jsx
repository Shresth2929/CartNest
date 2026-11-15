import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass, ShieldCheck, Leaf } from 'lucide-react';
import { api } from '../services/api';
import ProductGrid from '../components/product/ProductGrid';
import { useToast } from '../context/ToastContext';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [featuredRes, arrivalsRes, catRes] = await Promise.all([
          api.products.list({ sortBy: 'featured', limit: 4 }),
          api.products.list({ sortBy: 'newest', limit: 4 }),
          api.products.categories(),
        ]);

        if (featuredRes.success) setFeaturedProducts(featuredRes.data);
        if (arrivalsRes.success) setNewArrivals(arrivalsRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        showToast(err.message || 'Failed to load the storefront', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  const heroProduct = featuredProducts[0] || newArrivals[0];
  const heroImage = heroProduct?.images?.[0];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-cream-100 border-b border-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Handcrafted Mindful Living
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-charcoal-900 leading-[1.12]">
              Good things for the everyday.
            </h1>
            <p className="text-base sm:text-lg text-charcoal-600 max-w-xl leading-relaxed">
              Discover considered finds for your home, workspace and daily rituals — thoughtfully chosen, easy to love.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/shop"
                className="px-6 py-3.5 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full font-medium text-sm transition shadow-sm flex items-center gap-2"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={heroProduct ? `/products/${heroProduct.slug}` : '/shop'}
                className="px-6 py-3.5 bg-white hover:bg-cream-200 border border-charcoal-200 text-charcoal-800 rounded-full font-medium text-sm transition"
              >
                {heroProduct ? 'Discover a favourite' : 'Browse the collection'}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-xl border border-charcoal-200 bg-white">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroProduct.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-cream-100" aria-label="Product photography will appear here" />
              )}
            </div>
            {/* Float badge */}
            {heroProduct && (
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-lg border border-charcoal-100 hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700 font-bold">
                  ₹
                </div>
                <div className="text-xs">
                  <p className="font-bold text-charcoal-900">{heroProduct.name}</p>
                  <p className="text-charcoal-500">From ₹{Number(heroProduct.basePrice).toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-forest-700 uppercase tracking-widest">Just landed</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">New Arrivals</h2>
          </div>
          <Link to="/shop?sortBy=newest" className="text-sm font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1 group">
            See what’s new <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>
        <ProductGrid products={newArrivals} isLoading={isLoading} />
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-forest-700 uppercase tracking-widest">Thoughtful Living</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">Explore Curated Categories</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1 group">
            Browse all categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-charcoal-900 shadow-sm border border-charcoal-100"
            >
              <img
                src={cat.imageUrl || 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'}
                alt={cat.name}
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 group-hover:opacity-75 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/20 to-transparent flex flex-col justify-end p-5 text-cream-50">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-300">
                  {cat._count?.products || 0} Products
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 group-hover:text-forest-200 transition">
                  {cat.name}
                </h3>
                <p className="text-xs text-charcoal-300 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-forest-700 uppercase tracking-widest">Handcrafted Essentials</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">Featured Pieces</h2>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1 group">
            View full catalogue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} isLoading={isLoading} />
      </section>

      {/* Brand Values Showcase */}
      <section className="bg-cream-100/70 border-y border-charcoal-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="bg-white p-8 rounded-2xl border border-charcoal-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto sm:mx-0">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal-900">Natural &amp; Honest Materials</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              We choose solid timber over particle board, real washed European flax linen, and double-fired stoneware ceramics built to age gracefully.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-charcoal-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto sm:mx-0">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal-900">Designed for Calm Living</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Subdued earth tones, ergonomic sightlines, and uncluttered silhouettes help eliminate sensory noise in workspaces and homes.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-charcoal-100 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto sm:mx-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-charcoal-900">Atomic Stock &amp; Real Data</h3>
            <p className="text-xs text-charcoal-600 leading-relaxed">
              Powered by PostgreSQL ACID transactions and row-level conditional locking. What you see is genuine, live stock availability.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
