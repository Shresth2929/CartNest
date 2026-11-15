import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, DollarSign, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import Badge from '../../components/common/Badge';
import api from '../../services/api';
import {
  AdminCard, AdminEmpty, AdminError, AdminLoading, AdminPageHeader, formatCurrency,
} from '../../components/admin/AdminUi';

const colors = {
  PLACED: '#c0842d',
  PAID: '#3c6e57',
  PACKED: '#6184a7',
  SHIPPED: '#6f67a8',
  DELIVERED: '#2f8062',
  CANCELLED: '#bd5b55',
};

export default function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/reports');
      setReport(response.data);
    } catch (requestError) {
      setError(requestError.message || 'Reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  if (loading) return <AdminLoading label="Loading reports" />;
  if (error) return <AdminError message={error} onRetry={loadReport} />;
  if (!report) return <AdminEmpty>Report data is not available.</AdminEmpty>;

  const trend = report.salesByDay.map((day) => ({
    ...day,
    label: new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));
  const statuses = report.ordersByStatus.map((row) => ({ ...row, fill: colors[row.status] || '#9ca3af' }));

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Reports" description="Reconciled sales, order lifecycle, best-selling products and stock alerts." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">Eligible revenue</p><p className="mt-2 flex items-center gap-2 text-xl font-bold text-charcoal-900"><DollarSign className="h-5 w-5 text-forest-700" />{formatCurrency(report.summary.totalRevenue)}</p></AdminCard>
        <AdminCard className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">Total orders</p><p className="mt-2 flex items-center gap-2 text-xl font-bold text-charcoal-900"><ShoppingCart className="h-5 w-5 text-forest-700" />{report.summary.totalOrders}</p></AdminCard>
        <AdminCard className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">Active customers</p><p className="mt-2 flex items-center gap-2 text-xl font-bold text-charcoal-900"><Users className="h-5 w-5 text-forest-700" />{report.summary.totalCustomers}</p></AdminCard>
        <AdminCard className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">Low-stock products</p><p className="mt-2 flex items-center gap-2 text-xl font-bold text-charcoal-900"><Package className="h-5 w-5 text-forest-700" />{report.summary.lowStockProducts}</p></AdminCard>
      </div>
      <AdminCard className="flex items-start gap-3 p-4">
        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" />
        <div><p className="text-sm font-semibold text-charcoal-900">Revenue calculation</p><p className="mt-1 text-sm text-charcoal-600">{report.revenueDefinition}</p><p className="mt-1 text-xs text-charcoal-500">The chart shows the last 30 days; all amounts are taken from PostgreSQL order totals and payment records.</p></div>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminCard className="p-4 sm:p-5 xl:col-span-2">
          <h2 className="font-semibold text-charcoal-900">Daily eligible revenue</h2>
          <p className="mt-1 text-xs text-charcoal-500">Successful payment, non-cancelled orders only.</p>
          {trend.length === 0 ? <AdminEmpty>No revenue recorded.</AdminEmpty> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend} margin={{ top: 10, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#ece9e3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3c6e57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </AdminCard>
        <AdminCard className="p-4 sm:p-5">
          <h2 className="font-semibold text-charcoal-900">Order status mix</h2>
          {statuses.length === 0 ? <AdminEmpty>No orders have been recorded.</AdminEmpty> : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statuses} dataKey="count" nameKey="status" cx="50%" cy="45%" outerRadius={82} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {statuses.map((row) => <Cell key={row.status} fill={row.fill} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-charcoal-100 px-4 py-4">
            <Package className="h-4 w-4 text-forest-700" />
            <div><h2 className="font-semibold text-charcoal-900">Best sellers</h2><p className="text-xs text-charcoal-500">Sorted by units sold; cancelled or unpaid orders excluded.</p></div>
          </div>
          {report.bestSellingProducts.length === 0 ? <AdminEmpty>No eligible sales yet.</AdminEmpty> : (
            <div className="divide-y divide-charcoal-100">
              {report.bestSellingProducts.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-sm font-medium text-charcoal-800">{product.name}</span><div className="text-right"><p className="text-sm font-semibold">{product.totalQuantity} units</p><p className="text-xs text-charcoal-500">{formatCurrency(product.totalRevenue)}</p></div></div>)}
            </div>
          )}
        </AdminCard>

        <AdminCard className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-charcoal-100 px-4 py-4">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <div><h2 className="font-semibold text-charcoal-900">Low-stock report</h2><p className="text-xs text-charcoal-500">Active product and variant stock at or below {report.summary.lowStockThreshold}.</p></div>
          </div>
          {report.lowStockItems.length === 0 ? <AdminEmpty>No active products or variants are below the threshold.</AdminEmpty> : (
            <div className="divide-y divide-charcoal-100">
              {report.lowStockItems.map((item) => <div key={`${item.productId}-${item.variantId || 'base'}`} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-charcoal-800">{item.name}</p><p className="text-xs text-charcoal-500">{item.sku}</p></div><div className="flex shrink-0 items-center gap-2"><Badge status="PENDING" label={`${item.stock} left`} /><span className="hidden text-xs text-charcoal-500 sm:inline">{item.kind}</span></div></div>)}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
