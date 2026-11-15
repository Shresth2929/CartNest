import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Search, SlidersHorizontal } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  AdminCard, AdminEmpty, AdminError, AdminField, AdminLoading, AdminPageHeader,
  AdminPagination, buttonClass, formatDate, inputClass, secondaryButtonClass,
} from '../../components/admin/AdminUi';

export default function AdminInventoryPage() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [threshold, setThreshold] = useState('10');
  const [movements, setMovements] = useState([]);
  const [movementPage, setMovementPage] = useState(1);
  const [movementPagination, setMovementPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const inventoryParams = new URLSearchParams({
        page: String(page),
        limit: '20',
        lowStockOnly: String(lowStockOnly),
        threshold,
      });
      if (search.trim()) inventoryParams.set('search', search.trim());
      const movementParams = new URLSearchParams({ page: String(movementPage), limit: '10' });
      if (search.trim()) movementParams.set('search', search.trim());
      const [inventoryResponse, movementResponse] = await Promise.all([
        api.get(`/admin/inventory?${inventoryParams}`),
        api.get(`/admin/inventory/movements?${movementParams}`),
      ]);
      setInventory(inventoryResponse.data || []);
      setPagination(inventoryResponse.meta || { page: 1, total: 0, totalPages: 1 });
      setMovements(movementResponse.data || []);
      setMovementPagination(movementResponse.meta || { page: 1, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message || 'Inventory could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, movementPage, search, lowStockOnly, threshold]);

  useEffect(() => { loadData(); }, [loadData]);

  const beginAdjustment = (product, variant = null) => {
    setSelected({ product, variant });
    setDelta('');
    setReason('');
    setModalOpen(true);
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/inventory/adjustments', {
        productId: selected.product.id,
        variantId: selected.variant?.id || null,
        delta: Number(delta),
        reason: reason.trim(),
      });
      showToast('Stock adjusted and movement audited.', 'success');
      setModalOpen(false);
      await loadData();
    } catch (requestError) {
      showToast(requestError.message || 'Inventory adjustment failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const stockCell = (stock) => (
    <span className="inline-flex items-center gap-2">
      <span className={stock <= Number(threshold) ? 'font-semibold text-amber-800' : 'text-charcoal-800'}>{stock}</span>
      {stock <= Number(threshold) && <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="Low stock" />}
    </span>
  );

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Product and variant stock levels, atomic adjustments, and a complete movement ledger."
      />

      <AdminCard className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_auto_auto]">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => { setPage(1); setMovementPage(1); setSearch(event.target.value); }} placeholder="Search products, SKUs or movements" />
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal-700">
            <span>Low-stock threshold</span>
            <input className={`${inputClass} w-20`} type="number" min="0" value={threshold} onChange={(event) => { setPage(1); setThreshold(event.target.value); }} />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700">
            <input type="checkbox" checked={lowStockOnly} onChange={(event) => { setPage(1); setLowStockOnly(event.target.checked); }} />
            <SlidersHorizontal className="h-4 w-4" /> Low stock only
          </label>
          <button type="button" className={secondaryButtonClass} onClick={loadData}>Refresh</button>
        </div>
      </AdminCard>

      {error && <div className="mb-4"><AdminError message={error} onRetry={loadData} /></div>}
      {loading ? <AdminLoading label="Loading inventory" /> : (
        <AdminCard className="mb-6 overflow-hidden">
          {inventory.length === 0 ? <AdminEmpty>No inventory records match these filters.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr><th className="px-4 py-3 font-semibold">Item</th><th className="px-4 py-3 font-semibold">SKU</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Stock</th><th className="px-4 py-3 text-right font-semibold">Adjust</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {inventory.flatMap((product) => [
                    <tr key={product.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-charcoal-900">{product.name}<span className="ml-2 text-xs font-normal text-charcoal-500">{product.category.name}</span></td>
                      <td className="px-4 py-3 text-charcoal-600">{product.sku}</td>
                      <td className="px-4 py-3"><Badge status={product.isActive ? 'SUCCESS' : 'CANCELLED'} label={product.isActive ? 'Product' : 'Inactive'} /></td>
                      <td className="px-4 py-3">{stockCell(product.stock)}</td>
                      <td className="px-4 py-3 text-right"><button className={secondaryButtonClass} onClick={() => beginAdjustment(product)}><SlidersHorizontal className="h-4 w-4" /> Adjust</button></td>
                    </tr>,
                    ...product.variants.map((variant) => (
                      <tr key={variant.id} className="bg-cream-50/60">
                        <td className="px-4 py-3 pl-8 text-charcoal-700">↳ {product.name} · {variant.name}</td>
                        <td className="px-4 py-3 text-charcoal-600">{variant.sku}</td>
                        <td className="px-4 py-3 text-xs text-charcoal-500">Variant</td>
                        <td className="px-4 py-3">{stockCell(variant.stock)}</td>
                        <td className="px-4 py-3 text-right"><button className={secondaryButtonClass} onClick={() => beginAdjustment(product, variant)}><SlidersHorizontal className="h-4 w-4" /> Adjust</button></td>
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-charcoal-900">Stock movement history</h2>
          <p className="mt-1 text-xs text-charcoal-500">Includes manual adjustments and order checkout/cancellation movements.</p>
        </div>
        <span className="text-xs text-charcoal-500">{movementPagination.total} movements</span>
      </div>
      <AdminCard className="overflow-hidden">
        {movements.length === 0 ? <AdminEmpty>No stock movements recorded yet.</AdminEmpty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Product</th><th className="px-4 py-3 font-semibold">Change</th><th className="px-4 py-3 font-semibold">After</th><th className="px-4 py-3 font-semibold">Reason / Order</th><th className="px-4 py-3 font-semibold">Actor</th></tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-charcoal-500">{formatDate(movement.createdAt)}</td>
                    <td className="px-4 py-3"><p className="font-medium text-charcoal-800">{movement.product.name}</p><p className="text-xs text-charcoal-500">{movement.variant?.name || movement.product.sku}</p></td>
                    <td className={`px-4 py-3 font-semibold ${movement.delta < 0 ? 'text-red-700' : 'text-forest-800'}`}>
                      <span className="inline-flex items-center gap-1">{movement.delta < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}{movement.delta > 0 ? '+' : ''}{movement.delta}</span>
                    </td>
                    <td className="px-4 py-3">{movement.stockAfter}</td>
                    <td className="px-4 py-3"><p>{movement.reason}</p>{movement.order && <p className="text-xs text-charcoal-500">{movement.order.orderNumber}</p>}</td>
                    <td className="px-4 py-3 text-charcoal-600">{movement.actor?.name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPagination page={movementPage} pagination={movementPagination} onPageChange={setMovementPage} />
      </AdminCard>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adjust stock">
        {selected && (
          <form onSubmit={submitAdjustment} className="space-y-4">
            <div className="rounded-lg bg-cream-50 p-3 text-sm text-charcoal-700">
              <p className="font-semibold">{selected.product.name}{selected.variant ? ` · ${selected.variant.name}` : ''}</p>
              <p className="mt-1">Current stock: {selected.variant?.stock ?? selected.product.stock}</p>
            </div>
            <AdminField label="Signed quantity change">
              <input className={inputClass} type="number" step="1" required value={delta} onChange={(event) => setDelta(event.target.value)} placeholder="e.g. 8 or -2" />
            </AdminField>
            <AdminField label="Reason">
              <textarea className={inputClass} minLength={3} maxLength={300} required rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Receiving note, count correction…" />
            </AdminField>
            <p className="text-xs text-charcoal-500">Adjustments are atomic; stock cannot become negative. The action and resulting stock are recorded in the audit trail.</p>
            <div className="flex justify-end gap-2 border-t border-charcoal-100 pt-4">
              <button type="button" className={secondaryButtonClass} onClick={() => setModalOpen(false)}>Close</button>
              <button className={buttonClass} disabled={saving}>{saving ? 'Saving…' : 'Apply adjustment'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
