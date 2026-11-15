import React from 'react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Skeleton';
import { PackageOpen } from 'lucide-react';

export default function ProductGrid({ products, isLoading, emptyMessage = 'No mindful essentials found matching your criteria.' }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-charcoal-100 p-12 text-center my-8">
        <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center text-charcoal-400 mx-auto mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-charcoal-900 mb-1">No products found</h3>
        <p className="text-sm text-charcoal-500 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
