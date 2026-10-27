import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useToast } from '../../context/ToastContext';
import HelpGuideModal from '../common/HelpGuideModal';
import RolePermissionModal from '../common/RolePermissionModal';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  RefreshCw,
  Layers,
  Menu,
  X,
  Building2,
  BookOpen,
  CheckCircle,
  Briefcase,
  LogIn,
  ShieldCheck
} from 'lucide-react';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, company, companyName, roleTitle, isSuperAdmin, logout, updateProfile } = useAuth();
  const { criticalCount, unresolvedCount, triggerScan, loading: scanningAlerts } = useAlerts();
  const toast = useToast();
  const navigate = useNavigate();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    password: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const handleOpenProfile = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      password: ''
    });
    setIsProfileModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out. Redirecting to login portal...');
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone
      };
      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      await updateProfile(payload);
      toast.success('Operator profile updated successfully!');
      setIsProfileModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleScanClick = async () => {
    try {
      toast.info('Initiating live telemetry scan...');
      await triggerScan();
      toast.success('Telemetry scan evaluated. Fleet sensors nominal.');
    } catch (err) {
      toast.error('Scan failed to execute');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            aria-label="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 group-hover:scale-105 transition shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-mono">
                MINING<span className="text-amber-600">EQUIP</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold hidden sm:inline-block">
                  Equipment & Tyres
                </span>
              </span>
            </div>
          </Link>

          {/* Active Company Badge */}
          {companyName && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 ml-2">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{companyName}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                {roleTitle}
              </span>
            </div>
          )}

          {isSuperAdmin && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Admin Account</span>
            </div>
          )}
        </div>

        {/* Right side status and user menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Guide & Help Button */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Open Quick Guide & Simple Help"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Guide & Help</span>
          </button>

          {/* Role Permissions Access Matrix Button */}
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition shadow-2xs cursor-pointer"
            title="View 4-Role Permission & Multi-Tenant Access Matrix"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Role Permissions</span>
          </button>

          {/* System Status Ping */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-700 font-semibold">STATUS: ONLINE</span>
          </div>

          {/* Check for Problems button */}
          <button
            onClick={handleScanClick}
            disabled={scanningAlerts}
            title="Check equipment & tyres for problems"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanningAlerts ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
            <span>Check Problems</span>
          </button>

          {/* Active Problems Bell */}
          <Link
            to="/problems"
            className="relative p-2 rounded-lg bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition"
            title="View Active Problems"
          >
            <Bell className="w-5 h-5" />
            {unresolvedCount > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono text-white ${criticalCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'}`}>
                {unresolvedCount}
              </span>
            )}
          </Link>

          {/* User profile badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={handleOpenProfile}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-left transition cursor-pointer"
              title="View Operator Profile"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {user?.name || 'Operator'}
                </p>
                <p className="text-[10px] font-mono text-amber-700 uppercase font-semibold">
                  {roleTitle}
                </p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      <HelpGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Role Permission Matrix Modal */}
      <RolePermissionModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">User Profile</h3>
                  <p className="text-xs text-slate-500">{companyName} • {roleTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Overview Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Registered Company:</span>
                  <span className="text-xs font-bold text-slate-900">{companyName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Assigned Role:</span>
                  <span className="text-xs font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-100">{roleTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Email Address:</span>
                  <span className="text-xs font-mono text-slate-700">{user?.email}</span>
                </div>
              </div>

              {/* Profile Update Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out to Login
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-xs disabled:opacity-50"
                    >
                      {profileLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
