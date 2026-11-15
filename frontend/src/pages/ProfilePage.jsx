import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, MapPin, Plus, Trash2, Edit2, Shield, Package, Check } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Address Modal state (for add & edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
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

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await api.addresses.list();
      if (res.success && res.data) {
        setAddresses(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load address book', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
      return;
    }
    loadAddresses();
  }, [isAuthenticated, navigate]);

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.name || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: user?.phone || '',
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const res = await api.addresses.update(editingAddressId, addressForm);
        if (res.success) {
          showToast('Address updated successfully', 'success');
        }
      } else {
        const res = await api.addresses.create(addressForm);
        if (res.success) {
          showToast('New shipping address added', 'success');
        }
      }
      setIsModalOpen(false);
      loadAddresses();
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await api.addresses.delete(id);
      if (res.success) {
        showToast('Address deleted', 'info');
        loadAddresses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete address', 'error');
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      const res = await api.addresses.update(addr.id, { isDefault: true });
      if (res.success) {
        showToast('Default address updated', 'success');
        loadAddresses();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Title */}
      <div className="pb-6 border-b border-charcoal-200">
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Account &amp; Addresses</h1>
        <p className="text-sm text-charcoal-500 mt-1">Manage your customer profile and delivery address book</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-charcoal-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-800 text-2xl font-bold flex items-center justify-center">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-charcoal-900">{user?.name}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-forest-100 text-forest-800">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-charcoal-500 mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-xs text-charcoal-400 mt-0.5">{user.phone}</p>}
          </div>
        </div>

        <Link
          to="/orders"
          className="px-5 py-2.5 rounded-xl border border-charcoal-200 hover:border-forest-700 text-xs font-semibold text-charcoal-800 hover:text-forest-700 transition flex items-center gap-2"
        >
          <Package className="w-4 h-4" /> View My Orders
        </Link>
      </div>

      {/* Address Book Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-charcoal-900">Saved Addresses</h3>
            <p className="text-xs text-charcoal-500">Addresses used during checkout for delivery</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-cream-50 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Address
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-charcoal-400 animate-pulse">Loading address book...</div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-charcoal-200 p-8 text-center space-y-2">
            <MapPin className="w-8 h-8 text-charcoal-300 mx-auto" />
            <p className="text-xs font-semibold text-charcoal-700">No addresses saved yet</p>
            <p className="text-[11px] text-charcoal-400">Add your home or office address to speed up checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-2xl border border-charcoal-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-charcoal-200 transition"
              >
                <div className="space-y-1.5 text-xs text-charcoal-600">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-charcoal-900">{addr.fullName}</span>
                    {addr.isDefault ? (
                      <span className="text-[10px] bg-forest-100 text-forest-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3" /> Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="text-[11px] text-forest-700 hover:underline font-semibold"
                      >
                        Set as default
                      </button>
                    )}
                  </div>

                  <p className="text-charcoal-700">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-charcoal-500">{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                  <p className="text-charcoal-500 pt-1">Phone: {addr.phone}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal-100">
                  <button
                    onClick={() => handleOpenEditModal(addr)}
                    className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded-lg hover:bg-cream-100 transition"
                    title="Edit address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-charcoal-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddressId ? 'Edit Address' : 'Add New Shipping Address'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="profile-address-full-name" className="font-semibold text-charcoal-700 block mb-1">Full Name</label>
            <input
              id="profile-address-full-name"
              type="text"
              required
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="E.g. Aarav Sharma"
            />
          </div>

          <div>
            <label htmlFor="profile-address-line-1" className="font-semibold text-charcoal-700 block mb-1">Address Line 1</label>
            <input
              id="profile-address-line-1"
              type="text"
              required
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="Flat / House number, Street"
            />
          </div>

          <div>
            <label htmlFor="profile-address-line-2" className="font-semibold text-charcoal-700 block mb-1">Address Line 2 (Optional)</label>
            <input
              id="profile-address-line-2"
              type="text"
              value={addressForm.addressLine2}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              placeholder="Area, Landmark"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="profile-address-city" className="font-semibold text-charcoal-700 block mb-1">City</label>
              <input
                id="profile-address-city"
                type="text"
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="profile-address-state" className="font-semibold text-charcoal-700 block mb-1">State</label>
              <input
                id="profile-address-state"
                type="text"
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="profile-address-postal-code" className="font-semibold text-charcoal-700 block mb-1">Postal Code (PIN)</label>
              <input
                id="profile-address-postal-code"
                type="text"
                required
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="profile-address-phone" className="font-semibold text-charcoal-700 block mb-1">Phone Number</label>
              <input
                id="profile-address-phone"
                type="text"
                required
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                className="w-full p-2.5 bg-cream-50 border border-charcoal-200 rounded-xl"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer font-medium text-charcoal-700">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              className="rounded text-forest-700 focus:ring-forest-600"
            />
            Set as default address
          </label>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
