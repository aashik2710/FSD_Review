import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layers, Lock, Mail, ShieldAlert, CheckCircle, ArrowRight, Building2, Briefcase } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Access authorized. Initializing tenant workspace...');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials or server unavailable';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      toast.success(`Welcome! Logged in as ${demoEmail}`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background soft glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white p-6 sm:p-8 relative z-10 border border-slate-200 rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-3 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1.5 font-mono">
            MINING<span className="text-amber-600">EQUIP</span>
          </h1>
          <p className="text-xs text-slate-700 mt-1 uppercase font-mono tracking-wider font-bold">
            Company Owner & Company Manager Portal
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Fleet Machinery, OTR Tyres & Maintenance Management
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Company Owner & Manager Access */}
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            Instant 1-Click Role Login:
          </p>

          <div className="space-y-2.5 text-xs">
            {/* Company Owners */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Company Owners (Full Oversight)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('gold.owner@miningcorp.com', 'owner123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">👑 Gold Owner</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bharat Gold (BGML)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('coal.owner@miningcorp.com', 'owner123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">👑 Coal Owner</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Coal India Ltd (CIL)</p>
                </button>
              </div>
            </div>

            {/* Company Managers */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Company Managers (Full Fleet & Tyre Operations)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('gold.manager@miningcorp.com', 'manager123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">🔧 Gold Manager</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kolar Fleet & Tyres</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('coal.manager@miningcorp.com', 'manager123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">🔧 Coal Manager</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Jharia Basin Fleet</p>
                </button>
              </div>
            </div>

            {/* Field Technicians */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Field Technicians (Inspections & Problem Reporting)</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('gold.tech@miningcorp.com', 'tech123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">🛠️ Gold Technician</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">KGF Pit Operations</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('coal.tech@miningcorp.com', 'tech123')}
                  className="p-2.5 text-left bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1">🛠️ Coal Technician</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Jharia Field Team</p>
                </button>
              </div>
            </div>

            {/* Super Admin option */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@miningplatform.com', 'admin123')}
              className="w-full flex items-center justify-between p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-xs cursor-pointer"
            >
              <div className="text-left">
                <span className="font-bold">🛡️ Platform Super Admin</span>
                <span className="text-[10px] text-slate-400 ml-2">System Administration</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Operator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="operator@apexgold.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register New User Link */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2">
            Register as a New User
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
