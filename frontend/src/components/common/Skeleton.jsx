import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-charcoal-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-charcoal-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 bg-charcoal-100 rounded" />
        <div className="h-5 w-3/4 bg-charcoal-100 rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 w-1/4 bg-charcoal-100 rounded" />
          <div className="h-8 w-20 bg-charcoal-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="p-6 bg-white rounded-xl border border-charcoal-100 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-charcoal-100 rounded" />
        <div className="h-6 w-20 bg-charcoal-100 rounded-full" />
      </div>
      <div className="h-16 bg-cream-100 rounded-lg" />
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 bg-charcoal-100 rounded" />
        <div className="h-8 w-28 bg-charcoal-100 rounded-lg" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
      <div className="aspect-square bg-charcoal-100 rounded-2xl" />
      <div className="space-y-6">
        <div className="h-4 w-24 bg-charcoal-100 rounded" />
        <div className="h-8 w-3/4 bg-charcoal-100 rounded" />
        <div className="h-6 w-32 bg-charcoal-100 rounded" />
        <div className="h-24 bg-charcoal-100 rounded" />
        <div className="h-12 w-full bg-charcoal-100 rounded-xl" />
      </div>
    </div>
  );
}
