import { useCallback, useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  AdminCard, AdminEmpty, AdminError, AdminField, AdminLoading, AdminPageHeader,
  AdminPagination, buttonClass, formatCurrency, formatDate, inputClass, secondaryButtonClass,
} from '../../components/admin/AdminUi';

const transitions = {
  PLACED: ['PAID', 'CANCELLED'],
  PAID: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      const response = await api.get(`/admin/orders?${params}`);
      setOrders(response.data || []);
      setPagination(response.meta || { page: 1, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message || 'Orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const openDetails = async (order) => {
    setSelected({ ...order, detailLoading: true });
    setStatus('');
    setNotes('');
    try {
      const response = await api.get(`/admin/orders/${order.id}`);
      setSelected(response.data);
    } catch (requestError) {
      setSelected(null);
      showToast(requestError.message || 'Order details could not be loaded.', 'error');
    }
  };

  const updateStatus = async (event) => {
    event.preventDefault();
    if (!selected || !status) return;
    if (status === 'CANCELLED' && !window.confirm(`Cancel ${selected.orderNumber}? This restores inventory and refunds successful payment records.`)) return;
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${selected.id}/status`, { status, notes: notes.trim() || undefined });
      showToast(`Order status changed to ${status}.`, 'success');
      setStatus('');
      setNotes('');
      await Promise.all([loadOrders(), openDetails({ id: selected.id, orderNumber: selected.orderNumber })]);
    } catch (requestError) {
      showToast(requestError.message || 'Order status could not be changed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Orders" description="Review customer orders, payment state, fulfilment details and valid status transitions." />

      <AdminCard className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search order number, ID, customer or email" />
          </label>
          <select className={inputClass} value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} aria-label="Filter by order status">
            <option value="">All statuses</option>
            {Object.keys(transitions).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </AdminCard>

      {error && <div className="mb-4"><AdminError message={error} onRetry={loadOrders} /></div>}
      {loading ? <AdminLoading label="Loading orders" /> : (
        <AdminCard className="overflow-hidden">
          {orders.length === 0 ? <AdminEmpty>No orders match these filters.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr><th className="px-4 py-3 font-semibold">Order</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Payment</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-cream-50/60">
                      <td className="px-4 py-3 font-semibold text-charcoal-900">{order.orderNumber}<p className="mt-0.5 text-xs font-normal text-charcoal-500">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p></td>
                      <td className="px-4 py-3"><p className="font-medium">{order.user.name}</p><p className="text-xs text-charcoal-500">{order.user.email}</p></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-charcoal-600">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3"><Badge status={order.payments[0]?.status || 'PENDING'} /></td>
                      <td className="px-4 py-3"><Badge status={order.status} /></td>
                      <td className="px-4 py-3 text-right"><button className={secondaryButtonClass} onClick={() => openDetails(order)}><Eye className="h-4 w-4" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.orderNumber || 'Order details'} maxWidth="max-w-3xl">
        {selected?.detailLoading ? <AdminLoading label="Loading order details" /> : selected && (
          <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold text-charcoal-900">{selected.user.name}</p><p className="text-xs text-charcoal-500">{selected.user.email} · {selected.user.phone || 'No phone on file'}</p></div>
              <Badge status={selected.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminCard className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-charcoal-900">Items and totals</h3>
                <div className="space-y-2">{selected.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.productName}{item.variantName ? ` · ${item.variantName}` : ''} × {item.quantity}</span><span className="shrink-0">{formatCurrency(item.subtotal)}</span></div>)}</div>
                <div className="mt-3 space-y-1 border-t border-charcoal-100 pt-3 text-xs text-charcoal-600">
                  <p className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></p>
                  <p className="flex justify-between"><span>Tax</span><span>{formatCurrency(selected.tax)}</span></p>
                  <p className="flex justify-between"><span>Shipping</span><span>{formatCurrency(selected.shippingFee)}</span></p>
                  <p className="flex justify-between font-semibold text-charcoal-900"><span>Total</span><span>{formatCurrency(selected.total)}</span></p>
                </div>
              </AdminCard>
              <AdminCard className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-charcoal-900">Shipping and payment</h3>
                {selected.shippingAddress ? <div className="text-sm text-charcoal-700"><p className="font-medium">{selected.shippingAddress.fullName}</p><p>{selected.shippingAddress.addressLine1}</p>{selected.shippingAddress.addressLine2 && <p>{selected.shippingAddress.addressLine2}</p>}<p>{selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.postalCode}</p><p>{selected.shippingAddress.country} · {selected.shippingAddress.phone}</p></div> : <p className="text-sm text-charcoal-500">No saved shipping address.</p>}
                <div className="mt-4 space-y-2 border-t border-charcoal-100 pt-3">
                  {selected.payments.length === 0 ? <p className="text-sm text-charcoal-500">No payment record.</p> : selected.payments.map((payment) => <div key={payment.id} className="text-sm"><div className="flex items-center justify-between gap-2"><span>{payment.paymentMethod} · {formatCurrency(payment.amount)}</span><Badge status={payment.status} /></div>{payment.failureReason && <p className="text-xs text-red-700">{payment.failureReason}</p>}</div>)}
                </div>
              </AdminCard>
            </div>
            <AdminCard className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-charcoal-900">Status history</h3>
              {selected.statusHistory.length === 0 ? <p className="text-sm text-charcoal-500">No status history recorded.</p> : (
                <ol className="space-y-3">
                  {selected.statusHistory.map((entry, index) => <li key={`${entry.toStatus}-${entry.createdAt}-${index}`} className="flex items-start justify-between gap-4 text-sm"><div><p className="font-medium text-charcoal-800">{entry.fromStatus ? `${entry.fromStatus} → ` : ''}{entry.toStatus}</p><p className="text-xs text-charcoal-500">{entry.note || 'Status recorded'} · {entry.actor?.name || 'System'}</p></div><time className="shrink-0 text-xs text-charcoal-500">{formatDate(entry.createdAt)}</time></li>)}
                </ol>
              )}
            </AdminCard>

            {transitions[selected.status]?.length > 0 && (
              <form onSubmit={updateStatus} className="rounded-xl border border-charcoal-100 p-4">
                <h3 className="mb-3 text-sm font-semibold text-charcoal-900">Update order status</h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
                  <AdminField label="Next status">
                    <select className={inputClass} required value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="">Choose status</option>
                      {transitions[selected.status].map((next) => <option key={next} value={next}>{next}</option>)}
                    </select>
                  </AdminField>
                  <AdminField label="Admin note">
                    <input className={inputClass} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional status note" />
                  </AdminField>
                  <button className={`${buttonClass} self-end`} disabled={saving}>{saving ? 'Saving…' : 'Update'}</button>
                </div>
                <p className="mt-2 text-xs text-charcoal-500">Cancellation is available only in the existing order lifecycle and restores stock transactionally.</p>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
