import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cart, itemCount, subtotal, hasUnavailableItems, isLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center text-charcoal-400 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Your Bag Awaits</h2>
        <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
          Sign in to your CartNest customer account to access your persistent shopping bag and saved addresses.
        </p>
        <div className="pt-2">
          <Link
            to="/login?redirect=/cart"
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full text-sm font-semibold transition shadow-sm"
          >
            Sign In to Continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center text-charcoal-400 mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Your Shopping Bag is Empty</h2>
        <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
          Explore our collection of oak workspace risers, artisanal coffee pour-overs, and cedar botanicals.
        </p>
        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full text-sm font-semibold transition shadow-sm"
          >
            Explore Essentials <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Calculations for display
  const tax = Number((subtotal * 0.18).toFixed(2));
  const freeShippingThreshold = 1500;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : 99;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const total = Number((subtotal + tax + shippingFee).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-charcoal-200 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Shopping Bag</h1>
          <p className="text-sm text-charcoal-500 mt-1">
            {itemCount} {itemCount === 1 ? 'essential' : 'essentials'} curated for your home &amp; desk
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear bag
        </button>
      </div>

      {hasUnavailableItems && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>Some items in your bag exceed current inventory levels or have become inactive. Please adjust quantities before checkout.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Cart Items Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-charcoal-100 overflow-hidden divide-y divide-charcoal-100 shadow-xs">
          {cart.items.map((item) => (
            <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Product Thumbnail */}
              <Link to={`/products/${item.productSlug}`} className="w-20 h-20 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0 border border-charcoal-100">
                <img
                  src={item.productImage || 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=400&q=80'}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </Link>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.productSlug}`}
                  className="font-semibold text-sm text-charcoal-900 hover:text-forest-700 transition truncate block"
                >
                  {item.productName}
                </Link>
                {item.variantName && (
                  <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                    Option: <span className="text-charcoal-700">{item.variantName}</span>
                  </p>
                )}
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Unit Price: ₹{item.unitPrice.toLocaleString('en-IN')}
                </p>

                {!item.isAvailable && (
                  <p className="text-xs font-semibold text-red-600 mt-1">
                    Only {item.availableStock} in stock (requested {item.quantity})
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-charcoal-200 rounded-xl bg-cream-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={isLoading}
                    className="px-2.5 py-1 text-sm font-bold text-charcoal-600 hover:bg-cream-100 transition"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-charcoal-900 min-w-[2rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isLoading || item.quantity >= item.availableStock}
                    className="px-2.5 py-1 text-sm font-bold text-charcoal-600 hover:bg-cream-100 transition disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-charcoal-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right sm:min-w-[5rem]">
                <span className="text-sm font-bold text-charcoal-900">
                  ₹{item.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-charcoal-100 p-6 space-y-6 shadow-xs">
          <h3 className="font-bold text-base text-charcoal-900 pb-3 border-b border-charcoal-100">
            Order Summary
          </h3>

          {/* Free Shipping Progress */}
          <div className="p-3 bg-cream-100 rounded-xl text-xs space-y-1.5">
            {isFreeShipping ? (
              <p className="font-semibold text-forest-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest-700" /> Qualified for Free Standard Delivery!
              </p>
            ) : (
              <>
                <p className="text-charcoal-700">
                  Add <span className="font-bold text-forest-800">₹{amountToFreeShipping.toLocaleString('en-IN')}</span> more for free express shipping.
                </p>
                <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-forest-700 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Pricing Lines */}
          <div className="space-y-3 text-xs text-charcoal-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-charcoal-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (18%)</span>
              <span className="font-semibold text-charcoal-900">₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-charcoal-900">
                {isFreeShipping ? <span className="text-forest-700">FREE</span> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="pt-3 border-t border-charcoal-100 flex justify-between text-sm font-bold text-charcoal-900">
              <span>Estimated Total</span>
              <span className="text-base">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            disabled={hasUnavailableItems || isLoading}
            className="w-full py-3.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-cream-50 rounded-full font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/shop"
            className="block text-center text-xs font-semibold text-charcoal-500 hover:text-forest-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
