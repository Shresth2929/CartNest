import React from 'react';

const statusStyles = {
  PLACED: 'bg-amber-50 text-amber-800 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PACKED: 'bg-blue-50 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-forest-100 text-forest-800 border-forest-300',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  SUCCESS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  REFUNDED: 'bg-purple-50 text-purple-800 border-purple-200',
};

export default function Badge({ status, label, className = '' }) {
  const style = statusStyles[status] || 'bg-charcoal-100 text-charcoal-700 border-charcoal-200';
  const displayLabel = label || status?.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${style} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
