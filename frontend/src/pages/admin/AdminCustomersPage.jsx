import { useCallback, useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  AdminCard, AdminEmpty, AdminError, AdminLoading, AdminPageHeader, AdminPagination,
  formatCurrency, formatDate, inputClass, secondaryButtonClass,
} from '../../components/admin/AdminUi';

export default function AdminCustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      const response = await api.get(`/admin/customers?${params}`);
      setCustomers(response.data || []);
      setPagination(response.meta || { page: 1, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message || 'Customers could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const openCustomer = async (customer) => {
    setSelected(customer);
    setDetailLoading(true);
    try {
      const response = await api.get(`/admin/customers/${customer.id}`);
      setSelected(response.data);
    } catch (requestError) {
      setSelected(null);
      showToast(requestError.message || 'Customer details could not be loaded.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Customers" description="Customer profiles, registration dates and order summaries. Credentials and password hashes are never returned." />
      <AdminCard className="mb-4 p-3 sm:p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
          <input className={`${inputClass} pl-9`} value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search customer name or email" />
        </label>
      </AdminCard>
      {error && <div className="mb-4"><AdminError message={error} onRetry={loadCustomers} /></div>}
      {loading ? <AdminLoading label="Loading customers" /> : (
        <AdminCard className="overflow-hidden">
          {customers.length === 0 ? <AdminEmpty>No customers match this search.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Phone</th><th className="px-4 py-3 font-semibold">Registered</th><th className="px-4 py-3 font-semibold">Orders</th><th className="px-4 py-3 text-right font-semibold">Profile</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-cream-50/60">
                      <td className="px-4 py-3"><p className="font-semibold text-charcoal-900">{customer.name}</p><p className="text-xs text-charcoal-500">{customer.email}</p></td>
                      <td className="px-4 py-3 text-charcoal-600">{customer.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-charcoal-600">{formatDate(customer.createdAt)}</td>
                      <td className="px-4 py-3">{customer.orderCount}</td>
                      <td className="px-4 py-3 text-right"><button className={secondaryButtonClass} onClick={() => openCustomer(customer)}><Eye className="h-4 w-4" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Customer profile" maxWidth="max-w-3xl">
        {detailLoading ? <AdminLoading label="Loading customer" /> : selected && (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto">
            <AdminCard className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-semibold text-charcoal-900">{selected.name}</h2><p className="text-sm text-charcoal-600">{selected.email}</p><p className="text-sm text-charcoal-600">{selected.phone || 'No phone on file'}</p><p className="mt-2 text-xs text-charcoal-500">Registered {formatDate(selected.createdAt)}</p></div>
                <Badge status="SUCCESS" label="Customer" />
              </div>
              <p className="mt-3 text-xs text-charcoal-500">Customer account status controls are not available in the existing user schema.</p>
            </AdminCard>
            <div>
              <h3 className="mb-2 font-semibold text-charcoal-900">Order history</h3>
              {selected.orders.length === 0 ? <AdminEmpty>This customer has no orders.</AdminEmpty> : (
                <div className="space-y-2">
                  {selected.orders.map((order) => (
                    <AdminCard key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div><p className="font-semibold text-charcoal-900">{order.orderNumber}</p><p className="mt-1 text-xs text-charcoal-500">{formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items · Payment {order.paymentStatus}</p></div>
                      <div className="text-right"><Badge status={order.status} /><p className="mt-1 text-sm font-semibold text-charcoal-900">{formatCurrency(order.total)}</p></div>
                    </AdminCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
