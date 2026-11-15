import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const defaultImage = product.images?.[0] || 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80';
  const hasVariants = product.variants && product.variants.length > 0;
  const isOutOfStock = product.stock <= 0 && (!hasVariants || product.variants.every((v) => v.stock <= 0));
  const isLowStock = !isOutOfStock && product.stock <= 5;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    // If has variants, pass first variant by default
    const variantId = hasVariants ? product.variants[0].id : null;
    const res = await addToCart(product.id, variantId, 1);
    setIsAdding(false);

    if (res?.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-charcoal-100 hover:border-charcoal-200 hover:shadow-md transition duration-200 flex flex-col overflow-hidden">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-cream-100">
        <img
          src={defaultImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.category && (
            <span className="bg-white/90 backdrop-blur-sm text-charcoal-800 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              {product.category.name}
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
              Only {product.stock} left
            </span>
          )}
        </div>
      </Link>

      {/* Info Container */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link
            to={`/products/${product.slug}`}
            className="font-semibold text-sm text-charcoal-900 group-hover:text-forest-700 transition line-clamp-2"
          >
            {product.name}
          </Link>
          <p className="text-xs text-charcoal-500 mt-1 line-clamp-1">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-charcoal-100">
          <div>
            <span className="text-xs text-charcoal-400 font-medium">Price</span>
            <p className="font-bold text-base text-charcoal-900">
              ₹{Number(product.basePrice).toLocaleString('en-IN')}
            </p>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || isAdding}
            className={`p-2.5 rounded-xl flex items-center justify-center transition shadow-xs ${
              isOutOfStock
                ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                : justAdded
                ? 'bg-forest-600 text-white'
                : 'bg-cream-100 hover:bg-forest-700 text-charcoal-800 hover:text-white'
            }`}
            title={isOutOfStock ? 'Sold Out' : 'Quick Add to Bag'}
          >
            {justAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
