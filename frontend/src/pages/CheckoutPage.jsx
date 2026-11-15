import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, CreditCard, Plus, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function CheckoutPage() {
  const { cart, subtotal, hasUnavailableItems, isLoading: isCartLoading, fetchCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paymentSimulation, setPaymentSimulation] = useState('SUCCESS');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const checkoutInFlight = useRef(false);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    async function loadAddresses() {
      try {
        const res = await api.addresses.list();
        if (res.success && res.data) {
          setAddresses(res.data);
          // Set default address if available
          const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to load address book', 'error');
      }
    }

    loadAddresses();
  }, [isAuthenticated, navigate, showToast]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addresses.create(newAddress);
      if (res.success && res.data) {
        setAddresses((prev) => [res.data, ...prev]);
        setSelectedAddressId(res.data.id);
        setIsAddressModalOpen(false);
        showToast('Shipping address added', 'success');
        setNewAddress({
          fullName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
          phone: '',
          isDefault: false,
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (checkoutInFlight.current) return;
    if (!selectedAddressId) {
      showToast('Please select or add a shipping address', 'error');
      return;
    }
    if (!cart || cart.items.length === 0) {
      showToast('Your shopping bag is empty', 'error');
      navigate('/cart');
      return;
    }
    if (hasUnavailableItems) {
      showToast('Update or remove unavailable items before checkout', 'error');
      return;
    }

    checkoutInFlight.current = true;
    setIsSubmitting(true);
    const idempotencyKey = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const checkoutPayload = {
        shippingAddressId: selectedAddressId,
        paymentMethod,
        paymentSimulation,
        notes: notes.trim() || undefined,
      };

      const res = await api.checkout.placeOrder(checkoutPayload, idempotencyKey);
      if (res.success && res.data) {
        await fetchCart(); // Refresh cart to empty state
        showToast('Order confirmed and paid!', 'success');
        navigate(`/orders/${res.data.id}/success`, { state: { order: res.data } });
      }
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      checkoutInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  // Pricing calculations
  const tax = Number((subtotal * 0.18).toFixed(2));
  const shippingFee = subtotal >= 1500 ? 0 : 99;
  const total = Number((subtotal + tax + shippingFee).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-charcoal-200">
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Review your address, payment preference, and order summary
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Details */}
        <div className="lg:col-span-8 space-y-8">
          {/* Step 1: Shipping Address */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h2 className="text-base font-bold text-charcoal-900">Delivery Address</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 bg-cream-50 rounded-xl text-center border border-dashed border-charcoal-200 space-y-2">
                <p className="text-xs text-charcoal-500">No saved addresses found.</p>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 bg-forest-700 text-cream-50 rounded-xl text-xs font-semibold"
                >
                  Add Shipping Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-forest-700 bg-forest-50/50 ring-1 ring-forest-700'
                          : 'border-charcoal-200 bg-white hover:border-charcoal-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-charcoal-900">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-forest-100 text-forest-800 px-1.5 py-0.5 rounded font-semibold uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-charcoal-600 leading-snug">{addr.addressLine1}</p>
                        {addr.addressLine2 && <p className="text-charcoal-500">{addr.addressLine2}</p>}
                        <p className="text-charcoal-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-charcoal-500 pt-1">Phone: {addr.phone}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Preference & Simulation */}
          <div className="bg-white rounded-2xl border border-charcoal-100 p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-800 text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h2 className="text-base font-bold text-charcoal-900">Payment Method</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'CARD', label: 'Debit / Credit Card' },
                { id: 'UPI', label: 'Instant UPI (GPay / PhonePe)' },
                { id: 'NET_BANKING', label: 'Net Banking' },
                { id: 'COD', label: 'Cash on Delivery' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold text-center transition ${
                    paymentMethod === method.id
                      ? 'border-forest-700 bg-forest-50/70 text-forest-900 ring-1 ring-forest-700'
                      : 'border-charcoal-200 bg-white hover:border-charcoal-300 text-charcoal-700'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {/* Simulated Payment Outcome Toggle (Student / Showcase Mode) */}
            <div className="p-4 bg-cream-100 rounded-xl border border-charcoal-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wide">
                    Payment Gateway Simulation
                  </h4>
                  <p className="text-[11px] text-charcoal-500">
                    Test genuine success or failure flows without actual card credentials
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-charcoal-200 bg-white p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPaymentSimulation('SUCCESS')}
                    className={`px-3 py-1 rounded-md transition ${
                      paymentSimulation === 'SUCCESS'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    Simulate Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSimulation('FAILED')}
                    className={`px-3 py-1 rounded-md transition ${
                      paymentSimulation === 'FAILED'
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-charcoal-600 hover:text-charcoal-900'
                    }`}
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-charcoal-700">Delivery Instructions / Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="E.g. Ring bell or leave with building reception..."
                className="w-full bg-cream-50 border border-charcoal-200 rounded-xl p-3 text-xs text-charcoal-800 focus:outline-none focus:border-forest-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Submit */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-charcoal-100 p-6 space-y-6 shadow-xs">
          <h3 className="font-bold text-base text-charcoal-900 pb-3 border-b border-charcoal-100">
            Order Review ({cart?.totalItems || 0} items)
          </h3>

          {/* Quick Items Listing */}
          <div className="max-h-56 overflow-y-auto divide-y divide-charcoal-100 pr-1 text-xs space-y-2">
            {cart?.items?.map((item) => (
              <div key={item.id} className="pt-2 flex justify-between items-center gap-3">
                <div className="truncate flex-1">
                  <p className="font-semibold text-charcoal-800 truncate">{item.productName}</p>
                  <p className="text-charcoal-400">Qty: {item.quantity} {item.variantName ? `• ${item.variantName}` : ''}</p>
                </div>
                <span className="font-bold text-charcoal-900">₹{item.subtotal.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2.5 text-xs text-charcoal-600 border-t border-charcoal-100 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-charcoal-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (18%)</span>
              <span className="font-semibold text-charcoal-900">₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-charcoal-900">
                {shippingFee === 0 ? <span className="text-forest-700">FREE</span> : `₹${shippingFee}`}
              </span>
            </div>
            <div className="pt-3 border-t border-charcoal-100 flex justify-between text-sm font-bold text-charcoal-900">
              <span>Total Payable</span>
              <span className="text-lg text-forest-900">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-[11px] text-charcoal-500">
            These figures are estimates. Final prices, tax and delivery are calculated by CartNest when your order is placed.
          </p>
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || isCartLoading || hasUnavailableItems || !selectedAddressId || !cart?.items?.length}
            className="w-full py-4 bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-cream-50 rounded-full font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Processing Transaction...'
            ) : (
              <>
                <Lock className="w-4 h-4" /> Place Order Securely
              </>
            )}
          </button>

          <p className="text-[11px] text-charcoal-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-700" /> Protected by Idempotent Atomic Transaction
          </p>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add New Delivery Address"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-charcoal-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="E.g. Aarav Sharma"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal-700 block mb-1">Address Line 1</label>
            <input
              type="text"
              required
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="Flat / House No, Street name"
            />
          </div>

          <div>
            <label className="font-semibold text-charcoal-700 block mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              value={newAddress.addressLine2}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="Landmark, Area"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-charcoal-700 block mb-1">City</label>
              <input
                type="text"
                required
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
                placeholder="Bengaluru"
              />
            </div>
            <div>
              <label className="font-semibold text-charcoal-700 block mb-1">State</label>
              <input
                type="text"
                required
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
                placeholder="Karnataka"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-charcoal-700 block mb-1">Postal Code (PIN)</label>
              <input
                type="text"
                required
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
                placeholder="560001"
              />
            </div>
            <div>
              <label className="font-semibold text-charcoal-700 block mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-2 cursor-pointer font-medium text-charcoal-700">
            <input
              type="checkbox"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              className="rounded text-forest-700 focus:ring-forest-600"
            />
            Make this my default shipping address
          </label>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="px-4 py-2 border border-charcoal-200 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-xl font-semibold"
            >
              Save Address
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
