import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  const s = String(status || '').toLowerCase().trim();

  // 🟢 Good
  if (
    s === 'good' || 
    s === 'active' || 
    s === 'completed' || 
    s === 'in service' || 
    s === 'passed' ||
    s === 'resolved'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
        <span>🟢</span>
        <span>{status === 'Active' ? 'Active (Good)' : status === 'In Service' ? 'In Service (Good)' : 'Good'}</span>
      </span>
    );
  }

  // 🟡 Needs Checking
  if (
    s === 'warning' || 
    s === 'fair' || 
    s === 'under maintenance' || 
    s === 'in progress' || 
    s === 'assigned' || 
    s === 'scheduled' || 
    s === 'spare / inventory' ||
    s === 'medium' ||
    s === 'needs checking' ||
    s === 'needs attention'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
        <span>🟡</span>
        <span>{status === 'Under Maintenance' ? 'Under Maintenance' : status === 'Scheduled' ? 'Scheduled' : 'Needs Checking'}</span>
      </span>
    );
  }

  // 🔴 Problem
  if (
    s === 'critical' || 
    s === 'poor' || 
    s === 'breakdown' || 
    s === 'overdue' || 
    s === 'scrapped' || 
    s === 'problem' ||
    s === 'high'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
        <span>🔴</span>
        <span>{status === 'Breakdown' ? 'Breakdown (Problem)' : status === 'Critical' ? 'Critical Problem' : 'Problem'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
      <span>⚪</span>
      <span>{status || 'Unknown'}</span>
    </span>
  );
};

export default StatusBadge;
