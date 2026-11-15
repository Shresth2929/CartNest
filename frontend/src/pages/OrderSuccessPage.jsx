import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);
  const { showToast } = useToast();

  useEffect(() => {
    if (!order && id) {
      async function fetchOrder() {
        try {
          const res = await api.orders.getById(id);
          if (res.success && res.data) {
            setOrder(res.data);
          }
        } catch (err) {
          showToast(err.message || 'Failed to load order details', 'error');
        } finally {
          setIsLoading(false);
        }
      }
      fetchOrder();
    }
  }, [id, order, showToast]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 bg-cream-100 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-cream-100 rounded mx-auto" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-charcoal-900">Order Not Found</h2>
        <Link to="/orders" className="text-forest-700 font-semibold text-sm">
          View all your orders
        </Link>
      </div>
    );
  }

  const payment = order.payments?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Card */}
      <div className="bg-white rounded-3xl border border-charcoal-100 p-8 sm:p-10 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-forest-700 uppercase tracking-widest">
          Order Confirmed &amp; Paid
        </span>
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">
          Thank you for shopping mindful living.
        </h1>
        <p className="text-sm text-charcoal-600 max-w-md mx-auto">
          We have registered your order <span className="font-mono font-bold text-charcoal-900">{order.orderNumber}</span>. Your pieces are being packed in our workshop.
        </p>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            to={`/orders/${order.id}`}
            className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full text-xs font-semibold transition flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Track Order Status
          </Link>
          <Link
            to="/shop"
            className="px-6 py-2.5 bg-white border border-charcoal-200 text-charcoal-700 hover:bg-cream-100 rounded-full text-xs font-semibold transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-charcoal-100 gap-2">
          <div>
            <p className="text-xs text-charcoal-500">Order Number</p>
            <p className="text-base font-bold font-mono text-charcoal-900">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            {payment && <Badge status={payment.status} label={payment.status === 'SUCCESS' ? 'PAID' : payment.status} />}
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Purchased Items</h4>
          <div className="divide-y divide-charcoal-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-charcoal-900">{item.productName}</p>
                  {item.variantName && <p className="text-charcoal-500">{item.variantName}</p>}
                  <p className="text-charcoal-400 mt-0.5">Qty: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}</p>
                </div>
                <span className="font-bold text-charcoal-900 text-sm">₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-charcoal-100 pt-4 space-y-2 text-xs text-charcoal-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-charcoal-900">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span className="font-semibold text-charcoal-900">₹{Number(order.tax).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="font-semibold text-charcoal-900">
              {Number(order.shippingFee) === 0 ? <span className="text-forest-700">FREE</span> : `₹${order.shippingFee}`}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-charcoal-900 pt-2 border-t border-charcoal-100">
            <span>Total Paid</span>
            <span className="text-forest-900">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Delivery Address & Transaction Info */}
        <div className="border-t border-charcoal-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal-600">
          <div>
            <h5 className="font-bold text-charcoal-900 mb-1">Delivering To</h5>
            {order.shippingAddress ? (
              <p>
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
            ) : (
              <p>Standard delivery address</p>
            )}
          </div>
          <div>
            <h5 className="font-bold text-charcoal-900 mb-1">Payment Details</h5>
            <p>
              Method: <span className="font-semibold text-charcoal-900">{payment?.paymentMethod || 'CARD'}</span><br />
              Ref: <span className="font-mono text-charcoal-700">{payment?.transactionId || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
