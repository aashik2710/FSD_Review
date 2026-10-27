import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  CircleDot, 
  ClipboardCheck, 
  Wrench, 
  AlertTriangle, 
  FileText,
  Building2,
  Users, 
  History,
  ShieldCheck,
  Globe,
  LogIn,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { companyAPI } from '../../services/api';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, isOwner, isManager, isTechnician, selectedCompanyId, setSelectedCompanyId, company, companyName, roleTitle, logout } = useAuth();
  const { unresolvedCount } = useAlerts();
  const [companiesList, setCompaniesList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuperAdmin) {
      companyAPI.getAll().then((res) => {
        setCompaniesList(res.data?.data || []);
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(isSuperAdmin ? [{ name: 'Companies', path: '/companies', icon: Building2 }] : []),
    ...(isSuperAdmin || isOwner ? [{ name: 'Mining Sites', path: '/sites', icon: MapPin }] : []),
    ...(isSuperAdmin || isOwner ? [{ name: 'Personnel & Users', path: '/users', icon: Users }] : []),
    { name: 'Equipment', path: '/equipment', icon: Truck },
    { name: 'Tyres', path: '/tyres', icon: CircleDot },
    { name: 'Check Equipment', path: '/check-equipment', icon: ClipboardCheck },
    { name: 'Check Tyre', path: '/check-tyre', icon: CircleDot },
    ...(!isTechnician ? [{ name: isOwner ? 'Maintenance Approvals' : 'Maintenance', path: '/maintenance', icon: Wrench }] : []),
    { 
      name: 'Problems', 
      path: '/problems', 
      icon: AlertTriangle,
      badge: unresolvedCount > 0 ? unresolvedCount : null
    },
    { name: 'History', path: '/history', icon: History },
    ...(isSuperAdmin || isOwner ? [{ name: 'Reports', path: '/reports', icon: FileText }] : [])
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-[61px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } min-h-[calc(100vh-61px)] shadow-xs overflow-y-auto`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200">
            <span className="text-xs font-mono font-bold text-amber-600">MAIN MENU</span>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Company Switcher */}
          {isSuperAdmin && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-amber-500" />
                Select Company (Admin)
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">🌐 All Mining Companies</option>
                {companiesList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <p className="px-3 text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
              Operations Menu
            </p>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Company & Role Card */}
        <div className="pt-4 border-t border-slate-200">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-slate-900 truncate">
                {companyName || 'Mining Fleet'}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 pl-6 flex items-center gap-1.5">
              <span>Role:</span>
              <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wide">
                {roleTitle}
              </span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
