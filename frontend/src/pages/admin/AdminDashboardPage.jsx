import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

const STATUS_COLORS = {
  PLACED: '#6366f1',
  PAID: '#3b82f6',
  PACKED: '#f59e0b',
  SHIPPED: '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

function KPICard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-charcoal-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>;
  }

  const { summary, recentOrders, topProducts, salesByDay, ordersByStatus } = data;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-charcoal-800">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={fmt(summary.totalRevenue)} icon={DollarSign} color="bg-forest-600" />
        <KPICard title="Total Orders" value={summary.totalOrders} icon={ShoppingCart} color="bg-indigo-500" />
        <KPICard title="Products" value={summary.totalProducts} icon={Package} color="bg-amber-500" />
        <KPICard title="Customers" value={summary.totalCustomers} icon={Users} color="bg-blue-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by Day */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-forest-600" />
            <h2 className="font-semibold text-charcoal-800 text-sm">Revenue — Last 7 Days</h2>
          </div>
          {salesByDay.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN')} />
                <Bar dataKey="revenue" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-charcoal-800 text-sm mb-4">Orders by Status</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="_count.id"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {ordersByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n, p) => [v, p.payload.status]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-forest-600" />
              <h2 className="font-semibold text-charcoal-800 text-sm">Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="text-xs text-forest-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-charcoal-800 truncate">{order.customer}</p>
                  <p className="text-xs text-gray-400 truncate">{order.id.slice(0, 8)}…</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-charcoal-800">{fmt(order.totalAmount)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium`}
                    style={{ backgroundColor: STATUS_COLORS[order.status] + '22', color: STATUS_COLORS[order.status] }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-charcoal-800 text-sm mb-4">Top Products by Revenue</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">#{i + 1}</span>
                  <span className="text-xs text-charcoal-800 truncate">{p.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-charcoal-800">{fmt(p.totalRevenue)}</p>
                  <p className="text-xs text-gray-400">{p.totalQuantity} sold</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No sales data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
