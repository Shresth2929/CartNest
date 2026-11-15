import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  AdminCard, AdminEmpty, AdminError, AdminField, AdminLoading, AdminPageHeader,
  buttonClass, inputClass, secondaryButtonClass,
} from '../../components/admin/AdminUi';

const emptyCategory = () => ({ name: '', slug: '', description: '', imageUrl: '', isActive: true });

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyCategory);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
    } catch (requestError) {
      setError(requestError.message || 'Categories could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const create = () => {
    setSelected(null);
    setForm(emptyCategory());
    setModalOpen(true);
  };

  const edit = (category) => {
    setSelected(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive,
    });
    setModalOpen(true);
  };

  const setField = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'name' && !selected) {
        next.slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    };
    try {
      if (selected) await api.put(`/admin/categories/${selected.id}`, body);
      else await api.post('/admin/categories', body);
      showToast(selected ? 'Category updated.' : 'Category created.', 'success');
      setModalOpen(false);
      await loadCategories();
    } catch (requestError) {
      showToast(requestError.message || 'Category could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete “${category.name}”? Categories with products assigned cannot be deleted.`)) return;
    try {
      await api.delete(`/admin/categories/${category.id}`);
      showToast('Category deleted.', 'success');
      await loadCategories();
    } catch (requestError) {
      showToast(requestError.message || 'Category could not be deleted.', 'error');
    }
  };

  const toggleActive = async (category) => {
    try {
      await api.put(`/admin/categories/${category.id}`, { isActive: !category.isActive });
      showToast(category.isActive ? 'Category hidden from the storefront.' : 'Category is active in the storefront.', 'success');
      await loadCategories();
    } catch (requestError) {
      showToast(requestError.message || 'Category status could not be changed.', 'error');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organize the catalogue and control which categories appear in the customer storefront."
        action={<button className={buttonClass} onClick={create}><Plus className="h-4 w-4" /> Add category</button>}
      />
      {error && <div className="mb-4"><AdminError message={error} onRetry={loadCategories} /></div>}
      {loading ? <AdminLoading label="Loading categories" /> : (
        <AdminCard className="overflow-hidden">
          {categories.length === 0 ? <AdminEmpty>No categories have been created.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Products</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-cream-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal-900">{category.name}</p>
                        <p className="mt-0.5 text-xs text-charcoal-500">/{category.slug}</p>
                      </td>
                      <td className="px-4 py-3">{category._count?.products || 0}</td>
                      <td className="px-4 py-3"><Badge status={category.isActive ? 'SUCCESS' : 'CANCELLED'} label={category.isActive ? 'Active' : 'Inactive'} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className={secondaryButtonClass} onClick={() => toggleActive(category)}>{category.isActive ? 'Deactivate' : 'Activate'}</button>
                          <button className="rounded-lg p-2 text-charcoal-600 hover:bg-cream-100" onClick={() => edit(category)} aria-label={`Edit ${category.name}`}><Edit3 className="h-4 w-4" /></button>
                          <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit category' : 'Create category'}>
        <form onSubmit={save} className="space-y-4">
          <AdminField label="Name">
            <input className={inputClass} required minLength={2} maxLength={100} value={form.name} onChange={(event) => setField('name', event.target.value)} />
          </AdminField>
          <AdminField label="Slug">
            <input className={inputClass} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setField('slug', event.target.value)} />
          </AdminField>
          <AdminField label="Description">
            <textarea className={inputClass} rows={3} maxLength={1000} value={form.description} onChange={(event) => setField('description', event.target.value)} />
          </AdminField>
          <AdminField label="Image URL">
            <input className={inputClass} type="url" value={form.imageUrl} onChange={(event) => setField('imageUrl', event.target.value)} />
          </AdminField>
          <label className="flex items-center gap-2 text-sm text-charcoal-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setField('isActive', event.target.checked)} /> Active in storefront</label>
          <div className="flex justify-end gap-2 border-t border-charcoal-100 pt-4">
            <button type="button" className={secondaryButtonClass} onClick={() => setModalOpen(false)}>Close</button>
            <button className={buttonClass} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
