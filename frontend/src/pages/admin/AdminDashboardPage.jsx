import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import {
  AdminCard, AdminEmpty, AdminError, AdminLoading, AdminPageHeader, formatCurrency,
} from '../../components/admin/AdminUi';

const STATUS_COLORS = {
  PLACED: '#c0842d',
  PAID: '#3c6e57',
  PACKED: '#6184a7',
  SHIPPED: '#6f67a8',
  DELIVERED: '#2f8062',
  CANCELLED: '#bd5b55',
};

function MetricCard({ label, value, icon: Icon, detail }) {
  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-charcoal-900">{value}</p>
          <p className="mt-1 text-xs text-charcoal-500">{detail}</p>
        </div>
        <span className="rounded-lg bg-forest-50 p-2.5 text-forest-800">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </AdminCard>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <AdminLoading label="Loading dashboard" />;
  if (error) return <AdminError message={error} onRetry={loadDashboard} />;
  if (!data) return <AdminEmpty>Dashboard data is not available.</AdminEmpty>;

  const summary = data.summary;
  const chartDays = data.salesByDay.map((day) => ({
    ...day,
    label: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));
  const orderStatusData = data.ordersByStatus.map((row) => ({ ...row, fill: STATUS_COLORS[row.status] || '#9ca3af' }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="A live view of sales, orders, customers and catalogue health."
        action={<Link to="/admin/reports" className="inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:underline">Open reports <ArrowUpRight className="h-4 w-4" /></Link>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Eligible revenue" value={formatCurrency(summary.totalRevenue)} icon={DollarSign} detail="Paid, non-cancelled orders" />
        <MetricCard label="Total orders" value={summary.totalOrders} icon={ShoppingCart} detail="All recorded statuses" />
        <MetricCard label="Customers" value={summary.totalCustomers} icon={Users} detail="Registered customer accounts" />
        <MetricCard label="Active products" value={summary.totalActiveProducts} icon={Package} detail="Available in the catalogue" />
        <MetricCard label={`Low stock (≤${summary.lowStockThreshold})`} value={summary.lowStockProducts} icon={AlertTriangle} detail="Active products needing review" />
      </div>

      <p className="text-xs text-charcoal-500">{data.revenueDefinition}</p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminCard className="p-4 sm:p-5 xl:col-span-2">
          <div className="mb-4">
            <h2 className="font-semibold text-charcoal-900">Revenue trend</h2>
            <p className="mt-1 text-xs text-charcoal-500">Daily revenue from eligible orders over the last 30 days.</p>
          </div>
          {chartDays.length === 0 ? <AdminEmpty>No sales data yet.</AdminEmpty> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartDays} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#ece9e3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Date: ${label}`} />
                <Bar dataKey="revenue" name="Revenue" fill="#3c6e57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard className="p-4 sm:p-5">
          <h2 className="font-semibold text-charcoal-900">Orders by status</h2>
          {orderStatusData.length === 0 ? <AdminEmpty>No orders have been recorded.</AdminEmpty> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={82} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {orderStatusData.map((row) => <Cell key={row.status} fill={row.fill} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-charcoal-900">Recent orders</h2>
              <p className="mt-1 text-xs text-charcoal-500">Latest activity from the order database.</p>
            </div>
            <Link to="/admin/orders" className="text-sm font-semibold text-forest-800 hover:underline">View all</Link>
          </div>
          {data.recentOrders.length === 0 ? <AdminEmpty>No orders yet.</AdminEmpty> : (
            <div className="divide-y divide-charcoal-100">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-charcoal-800">{order.orderNumber}</p>
                    <p className="truncate text-xs text-charcoal-500">{order.customer.name} · {order.customer.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-charcoal-900">{formatCurrency(order.total)}</span>
                    <Badge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between border-b border-charcoal-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-charcoal-900">Best-selling products</h2>
              <p className="mt-1 text-xs text-charcoal-500">Units from non-cancelled orders with successful payment.</p>
            </div>
            <Link to="/admin/reports" className="text-sm font-semibold text-forest-800 hover:underline">Reports</Link>
          </div>
          {data.topProducts.length === 0 ? <AdminEmpty>No eligible product sales yet.</AdminEmpty> : (
            <div className="divide-y divide-charcoal-100">
              {data.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream-100 text-xs font-bold text-charcoal-700">{index + 1}</span>
                    <span className="truncate text-sm font-medium text-charcoal-800">{product.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-charcoal-900">{product.totalQuantity} sold</p>
                    <p className="text-xs text-charcoal-500">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
