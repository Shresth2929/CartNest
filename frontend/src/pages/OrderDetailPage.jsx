import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Truck, Package, Home, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

const STEPS = [
  { id: 'PLACED', label: 'Order Placed', icon: Clock },
  { id: 'PAID', label: 'Payment Verified', icon: CheckCircle2 },
  { id: 'PACKED', label: 'Workshop Packed', icon: Package },
  { id: 'SHIPPED', label: 'Dispatched & In Transit', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', icon: Home },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    async function fetchOrder() {
      setIsLoading(true);
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
  }, [id, isAuthenticated, navigate, showToast]);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await api.orders.cancel(order.id, cancelReason);
      if (res.success && res.data) {
        showToast('Order cancelled and inventory restored', 'success');
        setOrder(res.data);
        setIsCancelModalOpen(false);
        setCancelReason('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-cream-100 rounded" />
        <div className="h-40 bg-white rounded-2xl border border-charcoal-100" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-charcoal-900">Order Not Found</h2>
        <Link to="/orders" className="text-forest-700 font-semibold text-sm">
          Return to orders list
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const isCancellable = ['PLACED', 'PAID', 'PACKED'].includes(order.status);
  const currentStepIdx = STEPS.findIndex((s) => s.id === order.status);
  const payment = order.payments?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-forest-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-100">
          <div>
            <span className="text-xs text-charcoal-500">Order Number</span>
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-charcoal-900">{order.orderNumber}</h1>
            <p className="text-xs text-charcoal-400 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
            {isCancellable && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Stepper / Timeline */}
        {isCancelled ? (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3 text-red-800 text-xs">
            <XCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-bold">This order was cancelled.</p>
              <p className="text-[11px] text-red-700">Inventory was restored and payment updated to REFUNDED.</p>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        isCurrent
                          ? 'bg-forest-700 text-cream-50 ring-4 ring-forest-100 shadow-xs'
                          : isPassed
                          ? 'bg-forest-100 text-forest-700'
                          : 'bg-cream-100 text-charcoal-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] ${
                        isCurrent ? 'font-bold text-forest-800' : isPassed ? 'font-semibold text-charcoal-700' : 'text-charcoal-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order Details & Summary */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Line Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">Ordered Items</h3>
          <div className="divide-y divide-charcoal-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-charcoal-900">{item.productName}</p>
                  {item.variantName && <p className="text-charcoal-500">{item.variantName}</p>}
                  <p className="text-charcoal-400 mt-0.5">
                    {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="font-bold text-charcoal-900 text-sm">
                  ₹{Number(item.subtotal).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing breakdown */}
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
            <span>Total</span>
            <span className="text-forest-900">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Shipping Address & Payment */}
        <div className="border-t border-charcoal-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-charcoal-600">
          <div className="p-4 bg-cream-50 rounded-xl border border-charcoal-100 space-y-1">
            <h4 className="font-bold text-charcoal-900 text-xs mb-1">Delivery Address</h4>
            {order.shippingAddress ? (
              <>
                <p className="font-semibold text-charcoal-800">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
                <p className="pt-1 text-charcoal-500">Contact: {order.shippingAddress.phone}</p>
              </>
            ) : (
              <p>Standard address</p>
            )}
          </div>

          <div className="p-4 bg-cream-50 rounded-xl border border-charcoal-100 space-y-1">
            <h4 className="font-bold text-charcoal-900 text-xs mb-1">Payment Information</h4>
            <p>Method: <span className="font-semibold text-charcoal-900">{payment?.paymentMethod || 'CARD'}</span></p>
            <p>Status: <span className="font-semibold uppercase">{payment?.status || 'PENDING'}</span></p>
            <p className="pt-1 font-mono text-[11px] text-charcoal-500 truncate">Ref: {payment?.transactionId || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel This Order"
      >
        <div className="space-y-4 text-xs">
          <p className="text-charcoal-600">
            Confirm cancellation of order <span className="font-mono font-bold text-charcoal-900">{order.orderNumber}</span>.
          </p>
          <div className="p-3 bg-cream-100 rounded-xl text-charcoal-700 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-forest-700" /> Stock Restoration:
            </p>
            <p className="text-[11px] text-charcoal-500">
              Reserved quantities are returned to the catalog and payment is marked as REFUNDED.
            </p>
          </div>

          <div>
            <label className="font-semibold text-charcoal-700 block mb-1">Cancellation Reason</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="Why are you cancelling?"
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 border border-charcoal-200 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
