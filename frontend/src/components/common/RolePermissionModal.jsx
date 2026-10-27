import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Minus, 
  Crown, 
  Wrench, 
  Layers, 
  HardHat, 
  Building2, 
  FileText, 
  Truck, 
  CircleDot, 
  AlertTriangle 
} from 'lucide-react';

const RolePermissionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const permissions = [
    {
      module: '🏢 Mining Companies',
      superAdmin: 'Full: Create, Edit, Activate, Deactivate all companies',
      owner: 'View own company profile only',
      manager: 'View own company profile only',
      tech: 'View own company name only'
    },
    {
      module: '📍 Mining Sites & Pits',
      superAdmin: 'View, Add, Edit, Delete all sites',
      owner: 'Add, Edit, Manage company sites',
      manager: 'View assigned sites',
      tech: 'View assigned sites'
    },
    {
      module: '👥 User Accounts & Roster',
      superAdmin: 'Full Platform: Manage all user accounts',
      owner: 'Manage Company Managers & Field Technicians',
      manager: 'No user management access',
      tech: 'No user management access'
    },
    {
      module: '🚜 Heavy Equipment Machinery',
      superAdmin: 'View, Add, Edit, Delete all',
      owner: 'Add, Edit, Manage, Delete machinery',
      manager: 'Update machinery telemetry & Assign to Tech',
      tech: 'View assigned machinery; Edit status, hours & telemetry like Manager'
    },
    {
      module: '⭕ OTR Tyres Fleet',
      superAdmin: 'View, Add, Edit, Delete all tyres',
      owner: 'Add, Edit, Manage, Delete tyres',
      manager: 'Update tyre specs, Fit to axle, Scrap worn tyres',
      tech: 'View assigned tyres; Edit specs, PSI, tread & condition like Manager'
    },
    {
      module: '📋 Daily Equipment & Tyre Checks',
      superAdmin: 'View all platform audit logs',
      owner: 'View company audits & condition trends',
      manager: 'Review Technician updates & logs',
      tech: 'Perform checks, enter PSI/mm/°C/hours, update condition'
    },
    {
      module: '🛠️ Maintenance Tasks & Work Orders',
      superAdmin: 'View, Create, Edit, Delete all',
      owner: 'Review & Approve important maintenance decisions',
      manager: 'Create, Schedule, Edit, Assign tasks to Techs',
      tech: 'Update assigned maintenance tasks as Completed'
    },
    {
      module: '🚨 Problems & Safety Alerts',
      superAdmin: 'Global telemetry monitoring',
      owner: 'View problems & unresolved risk',
      manager: 'Resolve problems & initiate repair work orders',
      tech: 'Report equipment/tyre problems with photo upload'
    },
    {
      module: '📊 Analytics & Executive Reports',
      superAdmin: 'View global multi-tenant platform reports',
      owner: 'View financial, cost, and availability reports',
      manager: 'Restricted (Report field removed for Manager)',
      tech: 'Restricted (Report field removed for Technician)'
    },
    {
      module: '🔒 Multi-Tenant Isolation',
      superAdmin: 'Can inspect any company via platform selector',
      owner: 'Strictly isolated to Company A (No access to B)',
      manager: 'Strictly isolated to Company A (No access to B)',
      tech: 'Strictly isolated to Company A (No access to B)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                Role-Based Access Control (RBAC) & Permission Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Strict multi-tenant security architecture with distinct privileges for Platform Super Admin, Company Owner, Company Manager, and Field Technician.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Roles Summary Cards */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="p-1 rounded bg-slate-900 text-amber-400">🛡️</span>
              <span>1. Super Admin</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Platform-level role. Manages all mining companies, user rosters, and global configurations.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="p-1 rounded bg-amber-100 text-amber-800">👑</span>
              <span>2. Company Owner</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Complete company oversight. Manages sites, fleet, personnel, and approves maintenance budgets.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="p-1 rounded bg-sky-100 text-sky-800">🔧</span>
              <span>3. Company Manager</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Operations manager. Schedules work orders, fits tyres, assigns machinery, and reviews audits.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="p-1 rounded bg-emerald-100 text-emerald-800">🛠️</span>
              <span>4. Field Technician</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Field operator. Logs machine & tyre inspection readings, reports defects with photos, marks tasks done.
            </p>
          </div>
        </div>

        {/* Detailed Permission Matrix Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] uppercase font-mono font-bold text-slate-700">
                <th className="p-3">System Module</th>
                <th className="p-3 bg-slate-200/50">Platform Super Admin</th>
                <th className="p-3 bg-amber-50">Company Owner</th>
                <th className="p-3 bg-sky-50">Company Manager</th>
                <th className="p-3 bg-emerald-50">Field Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {permissions.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition font-sans">
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.module}
                  </td>
                  <td className="p-3 text-slate-700 font-medium bg-slate-50/30">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">✓</span> {row.superAdmin}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium bg-amber-50/20">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-amber-600 font-bold">✓</span> {row.owner}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium bg-sky-50/20">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-sky-600 font-bold">✓</span> {row.manager}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-medium bg-emerald-50/20">
                    <span className="inline-flex items-center gap-1">
                      {row.tech.includes('Restricted') || row.tech.includes('No') ? (
                        <span className="text-rose-500 font-bold">✕</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">✓</span>
                      )}
                      {row.tech}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-mono">🔐 TENANT ISOLATION:</span>
            <span>All queries automatically scoped to <code>companyId</code> from the authenticated JWT token.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionModal;
