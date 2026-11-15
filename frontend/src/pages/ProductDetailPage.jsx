import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Check, ShieldCheck, Truck, RotateCcw, ArrowLeft, PackageCheck } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { DetailSkeleton } from '../components/common/Skeleton';
import ImageWithFallback from '../components/common/ImageWithFallback';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.products.getBySlug(slug);
        if (res.success && res.data) {
          const prod = res.data;
          setProduct(prod);
          setSelectedImage(prod.images?.[0] || '');
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }
        }
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-charcoal-900">Product Not Found</h2>
        <p className="text-sm text-charcoal-500">{error || 'The product you are looking for does not exist or is inactive.'}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-700 text-cream-50 rounded-full text-sm font-medium hover:bg-forest-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  // Calculate pricing based on selected variant
  const basePrice = Number(product.basePrice);
  const variantAdjustment = selectedVariant ? Number(selectedVariant.priceAdjustment) : 0;
  const currentPrice = basePrice + variantAdjustment;

  // Determine available stock
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= 5;

  const handleAddToCart = async () => {
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    const res = await addToCart(product.id, selectedVariant?.id || null, quantity);
    setIsAdding(false);

    if (res?.success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-500">
        <Link to="/" className="hover:text-forest-700">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-forest-700">Catalogue</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-forest-700">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-charcoal-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-cream-100 border border-charcoal-200 shadow-xs">
            <ImageWithFallback
              src={selectedImage || product.images?.[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View product image ${idx + 1}`}
                  aria-pressed={selectedImage === img}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === img ? 'border-forest-700 scale-95' : 'border-transparent hover:border-charcoal-300'
                  }`}
                >
                  <ImageWithFallback src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            {product.category && (
              <span className="text-xs font-bold text-forest-700 uppercase tracking-widest">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
              {product.name}
            </h1>
            <p className="text-xs text-charcoal-400 mt-1">SKU: {selectedVariant?.sku || product.sku}</p>
          </div>

          {/* Pricing & Stock status */}
          <div className="flex items-baseline gap-4 py-2 border-y border-charcoal-100">
            <span className="text-3xl font-bold text-charcoal-900">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>

            {/* Live Stock Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isOutOfStock ? (
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-600" /> Out of stock
                </span>
              ) : isLowStock ? (
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" /> Only {currentStock} left in stock
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> In stock ({currentStock} available)
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-charcoal-600 leading-relaxed">
            {product.description}
          </p>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-charcoal-900 uppercase tracking-wider block">
                Select Option / Finish:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const varOutOfStock = variant.stock <= 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (quantity > variant.stock) setQuantity(Math.max(1, variant.stock));
                      }}
                      disabled={varOutOfStock}
                      aria-pressed={isSelected}
                      className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-forest-700 bg-forest-50/70 text-forest-900 font-bold ring-1 ring-forest-700'
                          : varOutOfStock
                          ? 'border-charcoal-100 bg-charcoal-50 text-charcoal-400 cursor-not-allowed line-through'
                          : 'border-charcoal-200 bg-white hover:border-charcoal-400 text-charcoal-800'
                      }`}
                    >
                      <span className="truncate">{variant.name}</span>
                      <span className="text-[11px] text-charcoal-500 mt-1">
                        {Number(variant.priceAdjustment) > 0 ? `+₹${variant.priceAdjustment}` : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add To Cart */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
                Quantity:
              </label>
              <div className="inline-flex items-center border border-charcoal-200 rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                  className="px-3 py-1.5 hover:bg-cream-100 disabled:opacity-40 transition font-bold text-sm text-charcoal-700"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-sm text-charcoal-900 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  aria-label="Increase quantity"
                  className="px-3 py-1.5 hover:bg-cream-100 disabled:opacity-40 transition font-bold text-sm text-charcoal-700"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              aria-busy={isAdding}
              className={`w-full py-4 rounded-full font-semibold text-sm transition shadow-md flex items-center justify-center gap-2 ${
                isOutOfStock
                  ? 'bg-charcoal-200 text-charcoal-500 cursor-not-allowed'
                  : justAdded
                  ? 'bg-forest-600 text-white'
                  : 'bg-forest-700 hover:bg-forest-800 text-cream-50'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5" /> Added to Your Bag
                </>
              ) : isAdding ? (
                'Adding...'
              ) : isOutOfStock ? (
                'Currently Sold Out'
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" /> Add to Bag — ₹{(currentPrice * quantity).toLocaleString('en-IN')}
                </>
              )}
            </button>
          </div>

          {/* Delivery & Assurance */}
          <div className="border-t border-charcoal-100 pt-6 space-y-3 text-xs text-charcoal-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-forest-700 flex-shrink-0" />
              <span>Complimentary insured shipping on orders above ₹1,500</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0" />
              <span>100% Genuine handcrafted natural material guarantee</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-forest-700 flex-shrink-0" />
              <span>Effortless order cancellation prior to dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
