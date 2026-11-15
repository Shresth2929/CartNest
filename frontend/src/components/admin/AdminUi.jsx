import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';

export const inputClass = 'w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2 text-sm text-charcoal-800 outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-100';
export const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-charcoal-200 bg-white px-4 py-2 text-sm font-semibold text-charcoal-700 transition hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-50';

export function AdminPageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-charcoal-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children, className = '' }) {
  return <section className={`rounded-xl border border-charcoal-100 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function AdminLoading({ label = 'Loading data' }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-charcoal-500" role="status">
      <LoaderCircle className="h-5 w-5 animate-spin text-forest-700" />
      {label}…
    </div>
  );
}

export function AdminError({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && <button className="font-semibold underline" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function AdminEmpty({ children = 'No records found.' }) {
  return <div className="px-6 py-12 text-center text-sm text-charcoal-500">{children}</div>;
}

export function AdminPagination({ page, pagination, onPageChange }) {
  const totalPages = Math.max(pagination?.totalPages || 1, 1);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-charcoal-100 px-4 py-3 text-sm">
      <span className="text-charcoal-500">{pagination.total} records · Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button
          className={secondaryButtonClass}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          className={secondaryButtonClass}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminField({ label, children, className = '' }) {
  return (
    <label className={`block space-y-1.5 text-sm font-medium text-charcoal-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
