import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  AdminCard, AdminEmpty, AdminError, AdminField, AdminLoading, AdminPageHeader,
  AdminPagination, buttonClass, formatCurrency, inputClass, secondaryButtonClass,
} from '../../components/admin/AdminUi';

const blankForm = () => ({
  name: '',
  slug: '',
  description: '',
  basePrice: '',
  categoryId: '',
  sku: '',
  stock: '0',
  imagesText: '',
  isFeatured: false,
  isActive: true,
  variants: [],
});

function toForm(product) {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: String(product.basePrice),
    categoryId: product.categoryId,
    sku: product.sku,
    stock: String(product.stock),
    imagesText: (product.images || []).join('\n'),
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    variants: product.variants.map((variant) => ({
      ...variant,
      priceAdjustment: String(variant.priceAdjustment),
      stock: String(variant.stock),
    })),
  };
}

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (activeFilter) params.set('isActive', activeFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      const [productResponse, categoryResponse] = await Promise.all([
        api.get(`/admin/products?${params}`),
        api.get('/admin/categories'),
      ]);
      setProducts(productResponse.data || []);
      setPagination(productResponse.meta || { page: 1, total: 0, totalPages: 1 });
      setCategories(categoryResponse.data || []);
    } catch (requestError) {
      setError(requestError.message || 'Products could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.isActive || category.id === form.categoryId),
    [categories, form.categoryId],
  );

  const beginCreate = () => {
    setEditing(null);
    setForm({ ...blankForm(), categoryId: availableCategories[0]?.id || '' });
    setModalOpen(true);
  };

  const beginEdit = (product) => {
    setEditing(product);
    setForm(toForm(product));
    setModalOpen(true);
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'name' && !editing) {
        next.slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
  };

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant),
    }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const variants = form.variants
        .filter((variant) => variant.name.trim() || variant.sku.trim())
        .map((variant) => ({
          ...(variant.id ? { id: variant.id } : {}),
          name: variant.name.trim(),
          sku: variant.sku.trim(),
          priceAdjustment: Number(variant.priceAdjustment),
          attributes: variant.attributes || {},
          ...(!editing || !variant.id ? { stock: Number(variant.stock || 0) } : {}),
        }));
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
        categoryId: form.categoryId,
        sku: form.sku.trim(),
        images: form.imagesText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        variants,
        ...(!editing ? { stock: Number(form.stock) } : {}),
      };

      if (editing) await api.put(`/admin/products/${editing.id}`, body);
      else await api.post('/admin/products', body);

      showToast(editing ? 'Product updated.' : 'Product created.', 'success');
      setEditing(null);
      setModalOpen(false);
      await loadProducts();
    } catch (requestError) {
      showToast(requestError.message || 'Product could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (product) => {
    if (!window.confirm(`Deactivate “${product.name}”? Existing order history will be preserved.`)) return;
    try {
      await api.delete(`/admin/products/${product.id}`);
      showToast('Product deactivated; order history was preserved.', 'success');
      await loadProducts();
    } catch (requestError) {
      showToast(requestError.message || 'Product could not be deactivated.', 'error');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage catalogue details, images, categories, variants and storefront visibility."
        action={<button className={buttonClass} onClick={beginCreate}><Plus className="h-4 w-4" /> Add product</button>}
      />

      <AdminCard className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_13rem]">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search name, SKU or slug" />
          </label>
          <select className={inputClass} value={activeFilter} onChange={(event) => { setPage(1); setActiveFilter(event.target.value); }} aria-label="Filter product status">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select className={inputClass} value={categoryFilter} onChange={(event) => { setPage(1); setCategoryFilter(event.target.value); }} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? '' : ' (Inactive)'}</option>)}
          </select>
        </div>
      </AdminCard>

      {error && <div className="mb-4"><AdminError message={error} onRetry={loadProducts} /></div>}
      {loading ? <AdminLoading label="Loading products" /> : (
        <AdminCard className="overflow-hidden">
          {products.length === 0 ? <AdminEmpty>No products match these filters.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-cream-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal-900">{product.name}</p>
                        <p className="mt-0.5 text-xs text-charcoal-500">{product.sku} · {product.variants.length} variants</p>
                      </td>
                      <td className="px-4 py-3 text-charcoal-600">{product.category.name}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(product.basePrice)}</td>
                      <td className="px-4 py-3">{product.stock}</td>
                      <td className="px-4 py-3"><Badge status={product.isActive ? 'SUCCESS' : 'CANCELLED'} label={product.isActive ? 'Active' : 'Inactive'} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className={secondaryButtonClass} onClick={() => beginEdit(product)} aria-label={`Edit ${product.name}`}><Edit3 className="h-4 w-4" /> Edit</button>
                          {product.isActive && <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => deactivate(product)} aria-label={`Deactivate ${product.name}`}><Trash2 className="h-4 w-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setEditing(null); setModalOpen(false); }} title={editing ? 'Edit product' : 'Create product'} maxWidth="max-w-4xl">
        <form onSubmit={saveProduct} className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Product name">
              <input className={inputClass} required minLength={2} maxLength={160} value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
            </AdminField>
            <AdminField label="Slug">
              <input className={inputClass} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} />
            </AdminField>
            <AdminField label="SKU">
              <input className={inputClass} required value={form.sku} onChange={(event) => updateForm('sku', event.target.value)} />
            </AdminField>
            <AdminField label="Category">
              <select className={inputClass} required value={form.categoryId} onChange={(event) => updateForm('categoryId', event.target.value)}>
                <option value="">Choose category</option>
                {availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </AdminField>
            <AdminField label="Base price (₹)">
              <input className={inputClass} required type="number" min="0.01" step="0.01" value={form.basePrice} onChange={(event) => updateForm('basePrice', event.target.value)} />
            </AdminField>
            {!editing && <AdminField label="Initial product stock">
              <input className={inputClass} required type="number" min="0" step="1" value={form.stock} onChange={(event) => updateForm('stock', event.target.value)} />
            </AdminField>}
          </div>
          <AdminField label="Description">
            <textarea className={inputClass} required rows={3} maxLength={5000} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </AdminField>
          <AdminField label="Image URLs (one URL per line)">
            <textarea className={inputClass} rows={3} value={form.imagesText} onChange={(event) => updateForm('imagesText', event.target.value)} placeholder="https://example.com/product.jpg" />
          </AdminField>

          <div className="rounded-xl border border-charcoal-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">Variants</h3>
                <p className="text-xs text-charcoal-500">Existing stock is changed only in Inventory.</p>
              </div>
              <button type="button" className={secondaryButtonClass} onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, { name: '', sku: '', priceAdjustment: '0', stock: '0', attributes: {} }] }))}><Plus className="h-4 w-4" /> Add variant</button>
            </div>
            <div className="space-y-3">
              {form.variants.map((variant, index) => (
                <div key={variant.id || `new-${index}`} className="grid gap-2 rounded-lg bg-cream-50 p-3 sm:grid-cols-[1.3fr_1fr_0.8fr_0.6fr_auto]">
                  <input className={inputClass} required={Boolean(variant.name || variant.sku)} aria-label="Variant name" placeholder="Variant name" value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} />
                  <input className={inputClass} required={Boolean(variant.name || variant.sku)} aria-label="Variant SKU" placeholder="Variant SKU" value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} />
                  <input className={inputClass} required type="number" step="0.01" aria-label="Variant price adjustment" placeholder="Price ±₹" value={variant.priceAdjustment} onChange={(event) => updateVariant(index, 'priceAdjustment', event.target.value)} />
                  {variant.id
                    ? <div className="self-center text-xs text-charcoal-600">Stock: {variant.stock}</div>
                    : <input className={inputClass} type="number" min="0" step="1" aria-label="Initial variant stock" placeholder="Stock" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} />}
                  <button type="button" className="justify-self-end rounded-lg p-2 text-charcoal-500 hover:bg-red-50 hover:text-red-600" onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))} aria-label="Remove variant"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {form.variants.length === 0 && <p className="text-sm text-charcoal-500">No variants configured.</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-charcoal-700"><input type="checkbox" checked={form.isFeatured} onChange={(event) => updateForm('isFeatured', event.target.checked)} /> Featured</label>
            <label className="flex items-center gap-2 text-sm text-charcoal-700"><input type="checkbox" checked={form.isActive} onChange={(event) => updateForm('isActive', event.target.checked)} /> Active in storefront</label>
          </div>
          <div className="flex justify-end gap-2 border-t border-charcoal-100 pt-4">
            <button type="button" className={secondaryButtonClass} onClick={() => { setEditing(null); setModalOpen(false); }}>Close</button>
            <button type="submit" className={buttonClass} disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
