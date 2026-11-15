import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import { OrderRowSkeleton } from '../components/common/Skeleton';
import Modal from '../components/common/Modal';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation Modal state
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/orders');
      return;
    }

    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await api.orders.list();
        if (res.success && res.data) {
          setOrders(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        showToast('Failed to load orders', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [isAuthenticated, navigate, showToast]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const res = await api.orders.cancel(orderToCancel.id, cancelReason);
      if (res.success && res.data) {
        showToast('Order cancelled and inventory restored', 'success');
        // Update local orders list
        setOrders((prev) =>
          prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: 'CANCELLED' } : o))
        );
        setOrderToCancel(null);
        setCancelReason('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-charcoal-200">
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Your Orders</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Review past purchases, monitor delivery progression, or manage cancellations
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <OrderRowSkeleton />
          <OrderRowSkeleton />
          <OrderRowSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-charcoal-100 p-12 text-center my-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center text-charcoal-400 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal-900">No orders placed yet</h3>
          <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
            Explore our curated selection of oak workspace risers and artisanal ceramics.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-full text-xs font-semibold"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCancellable = ['PLACED', 'PAID', 'PACKED'].includes(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-charcoal-100 p-6 shadow-xs space-y-4 hover:border-charcoal-200 transition"
              >
                {/* Top Row: Meta & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-charcoal-100 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-charcoal-900">{order.orderNumber}</span>
                      <Badge status={order.status} />
                    </div>
                    <p className="text-xs text-charcoal-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-charcoal-400">Total Amount</p>
                    <p className="font-bold text-base text-charcoal-900">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-charcoal-100">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-charcoal-800">{item.productName}</p>
                        {item.variantName && <p className="text-charcoal-500">{item.variantName}</p>}
                        <p className="text-charcoal-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-charcoal-900">₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Actions Row */}
                <div className="pt-3 border-t border-charcoal-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1.5"
                  >
                    View Tracking &amp; Invoice <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {isCancellable && (
                    <button
                      onClick={() => setOrderToCancel(order)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title="Confirm Order Cancellation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-charcoal-600">
            Are you sure you want to cancel order <span className="font-mono font-bold text-charcoal-900">{orderToCancel?.orderNumber}</span>?
          </p>
          <div className="p-3 bg-cream-100 rounded-xl text-charcoal-700 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-forest-700" /> Exact-once Stock Restoration:
            </p>
            <p className="text-[11px] text-charcoal-500">
              The reserved items will be safely returned to live store inventory, and the payment status will be updated to REFUNDED.
            </p>
          </div>

          <div>
            <label className="font-semibold text-charcoal-700 block mb-1">Reason for cancellation (Optional)</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              placeholder="E.g. Found alternative or ordered by mistake..."
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setOrderToCancel(null)}
              className="px-4 py-2 border border-charcoal-200 rounded-xl font-medium"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
            >
              {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
