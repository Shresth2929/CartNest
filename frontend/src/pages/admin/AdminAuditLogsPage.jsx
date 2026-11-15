import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import {
  AdminCard, AdminEmpty, AdminError, AdminLoading, AdminPageHeader, AdminPagination,
  formatDate, inputClass,
} from '../../components/admin/AdminUi';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (action.trim()) params.set('action', action.trim());
      if (entityType) params.set('entityType', entityType);
      const response = await api.get(`/admin/audit-logs?${params}`);
      setLogs(response.data || []);
      setPagination(response.meta || { page: 1, total: 0, totalPages: 1 });
    } catch (requestError) {
      setError(requestError.message || 'Audit log could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, action, entityType]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div>
      <AdminPageHeader title="Audit logs" description="Trace administrative actions, inventory adjustments, payment lifecycle events and order changes." />
      <AdminCard className="mb-4 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input className={`${inputClass} pl-9`} value={action} onChange={(event) => { setPage(1); setAction(event.target.value); }} placeholder="Filter action name" />
          </label>
          <select className={inputClass} value={entityType} onChange={(event) => { setPage(1); setEntityType(event.target.value); }} aria-label="Filter by entity type">
            <option value="">All entity types</option>
            {['PRODUCT', 'CATEGORY', 'ORDER', 'CHECKOUT', 'USER', 'SYSTEM'].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </AdminCard>
      {error && <div className="mb-4"><AdminError message={error} onRetry={loadLogs} /></div>}
      {loading ? <AdminLoading label="Loading audit logs" /> : (
        <AdminCard className="overflow-hidden">
          {logs.length === 0 ? <AdminEmpty>No audit events match these filters.</AdminEmpty> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-cream-50 text-xs uppercase tracking-wide text-charcoal-500">
                  <tr><th className="px-4 py-3 font-semibold">Timestamp</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 font-semibold">Actor</th><th className="px-4 py-3 font-semibold">Entity</th><th className="px-4 py-3 font-semibold">Changes / context</th></tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-charcoal-500">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3"><span className="rounded-md bg-forest-50 px-2 py-1 text-xs font-semibold text-forest-900">{log.action}</span></td>
                      <td className="px-4 py-3"><p className="font-medium text-charcoal-800">{log.user?.name || 'System'}</p><p className="text-xs text-charcoal-500">{log.user?.email || '—'}</p></td>
                      <td className="px-4 py-3"><p className="font-medium text-charcoal-800">{log.entityType}</p><p className="max-w-40 truncate text-xs text-charcoal-500" title={log.entityId}>{log.entityId}</p></td>
                      <td className="max-w-[32rem] px-4 py-3"><pre className="whitespace-pre-wrap break-words text-xs text-charcoal-600">{JSON.stringify(log.metadata, null, 2)}</pre></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pagination={pagination} onPageChange={setPage} />
        </AdminCard>
      )}
    </div>
  );
}
