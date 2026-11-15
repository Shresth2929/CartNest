import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import ProductGrid from '../components/product/ProductGrid';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state initialized from URL query params
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sortBy') || 'featured';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.products.categories();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load products whenever searchParams change
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const params = {
          search: searchParams.get('search') || undefined,
          category: searchParams.get('category') || undefined,
          sortBy: searchParams.get('sortBy') || 'featured',
          minPrice: searchParams.get('minPrice') || undefined,
          maxPrice: searchParams.get('maxPrice') || undefined,
          page: searchParams.get('page') || 1,
          limit: 12,
        };

        const res = await api.products.list(params);
        if (res.success) {
          setProducts(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value !== undefined && value !== null && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page to 1 whenever a filter changes (except for page itself)
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPriceInput) newParams.set('minPrice', minPriceInput);
    else newParams.delete('minPrice');
    if (maxPriceInput) newParams.set('maxPrice', maxPriceInput);
    else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const hasActiveFilters = currentSearch || currentCategory || currentMinPrice || currentMaxPrice || currentSort !== 'featured';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">The Catalogue</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            Showing {meta.total} mindful essentials crafted for natural spaces
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-charcoal-200 rounded-xl text-sm font-medium bg-white"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={currentSort}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="bg-white border border-charcoal-200 rounded-xl px-3 py-2 text-sm text-charcoal-800 focus:outline-none focus:border-forest-700"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-6">
          {/* Search Box */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-100 space-y-3">
            <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Search</h4>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Keywords..."
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-forest-700"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5 pointer-events-none" />
            </form>
          </div>

          {/* Categories Filter */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-100 space-y-3">
            <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Categories</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => updateParam('category', '')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                  !currentCategory
                    ? 'bg-forest-100 text-forest-800 font-bold'
                    : 'text-charcoal-700 hover:bg-cream-100'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[11px] text-charcoal-400">{meta.total}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('category', cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    currentCategory === cat.slug
                      ? 'bg-forest-100 text-forest-800 font-bold'
                      : 'text-charcoal-700 hover:bg-cream-100'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[11px] text-charcoal-400">{cat._count?.products || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white p-5 rounded-2xl border border-charcoal-100 space-y-3">
            <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Price Range (₹)</h4>
            <form onSubmit={handlePriceApply} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full bg-cream-50 border border-charcoal-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-forest-700"
                />
                <span className="text-charcoal-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full bg-cream-50 border border-charcoal-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-forest-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-charcoal-900 hover:bg-charcoal-800 text-cream-50 text-xs font-semibold rounded-xl transition"
              >
                Apply Range
              </button>
            </form>
          </div>

          {/* Clear Filters CTA */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Reset All Filters
            </button>
          )}
        </aside>

        {/* Main Products Grid Column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 bg-cream-100 p-3 rounded-xl border border-charcoal-200 text-xs">
              <span className="font-semibold text-charcoal-600">Active filters:</span>
              {currentCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-charcoal-200 font-medium text-charcoal-800">
                  Category: {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                  <button onClick={() => updateParam('category', '')}><X className="w-3 h-3 text-charcoal-400 hover:text-charcoal-700" /></button>
                </span>
              )}
              {currentSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-charcoal-200 font-medium text-charcoal-800">
                  Search: "{currentSearch}"
                  <button onClick={() => updateParam('search', '')}><X className="w-3 h-3 text-charcoal-400 hover:text-charcoal-700" /></button>
                </span>
              )}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full border border-charcoal-200 font-medium text-charcoal-800">
                  Price: ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || '∞'}
                  <button onClick={() => { setMinPriceInput(''); setMaxPriceInput(''); updateParam('minPrice', ''); updateParam('maxPrice', ''); }}><X className="w-3 h-3 text-charcoal-400 hover:text-charcoal-700" /></button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-forest-700 hover:underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid */}
          <ProductGrid products={products} isLoading={isLoading} />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-charcoal-200 pt-6">
              <button
                onClick={() => updateParam('page', currentPage - 1)}
                disabled={!meta.hasPrevPage}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border ${
                  meta.hasPrevPage
                    ? 'border-charcoal-200 bg-white hover:bg-cream-100 text-charcoal-800'
                    : 'border-charcoal-100 text-charcoal-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="text-xs font-medium text-charcoal-600">
                Page <span className="font-bold text-charcoal-900">{meta.page}</span> of {meta.totalPages}
              </div>

              <button
                onClick={() => updateParam('page', currentPage + 1)}
                disabled={!meta.hasNextPage}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border ${
                  meta.hasNextPage
                    ? 'border-charcoal-200 bg-white hover:bg-cream-100 text-charcoal-800'
                    : 'border-charcoal-100 text-charcoal-300 cursor-not-allowed'
                }`}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
