import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  dashboardAPI, 
  equipmentAPI, 
  alertAPI,
  maintenanceAPI,
  inspectionAPI
} from '../services/api';
import { useAlerts } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import {
  Truck,
  CircleDot,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Plus,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Building2,
  Gauge,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HelpGuideModal from '../components/common/HelpGuideModal';

const Dashboard = () => {
  const { user, companyName, roleTitle, isSuperAdmin, isOwner, isManager, isTechnician } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isWorkOrdersExpanded, setIsWorkOrdersExpanded] = useState(false);
  const { alerts, resolveAlert, triggerScan, loading: scanning } = useAlerts();
  const toast = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes, equipmentRes, maintRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCharts().catch(() => ({ data: { data: null } })),
        equipmentAPI.getAll({ limit: 5 }),
        !isTechnician
          ? maintenanceAPI.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } })
      ]);
      setStats(statsRes.data?.data);
      setCharts(chartsRes.data?.data);
      setRecentEquipment(equipmentRes.data?.data || []);
      setUpcomingMaintenance(maintRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleScanClick = async () => {
    try {
      toast.info('Checking equipment and tyres...');
      await triggerScan();
      toast.success('Check complete! Status updated.');
      loadDashboardData();
    } catch (err) {
      toast.error('Failed to run system check');
    }
  };

  const COLORS = {
    Good: '#10B981',
    Warning: '#F59E0B',
    Critical: '#EF4444'
  };

  const getStatusBadge = (status) => {
    if (status === 'Active' || status === 'Good') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          🟢 Good
        </span>
      );
    }
    if (status === 'Under Maintenance' || status === 'Warning' || status === 'Needs Checking') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          🟡 Needs Checking
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
        🔴 Problem
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Company Name and Role */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-6 text-slate-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-lg bg-black/20 text-slate-950 font-black text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-slate-950" />
              <span>{companyName || 'Mining Fleet Operations'}</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/30 text-slate-950 font-black text-xs uppercase tracking-wide">
              {roleTitle}
            </span>
            <span className="text-xs text-amber-950 font-semibold ml-1">
              Today: {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 flex flex-wrap items-center gap-2">
            <span>Welcome, {user?.name || 'Operator'}</span>
            <span className="text-sm font-semibold text-amber-950">({roleTitle} • {companyName})</span>
          </h1>
          <p className="text-xs text-amber-950 font-medium max-w-xl mt-1">
            {isSuperAdmin
              ? '🛡️ Platform Super Admin Portal — Full governance across all mining companies, users, and platform infrastructure.'
              : isOwner 
                ? '👑 Company Owner Portal — Full oversight over all mining machinery, tyres, sites, personnel, and work order approvals.'
                : isManager
                  ? '🔧 Company Manager Portal — Fleet telemetry monitoring, tyre assignments, work order scheduling, and problem resolution.'
                  : '🛠️ Field Technician Portal — Conduct machinery & tyre daily inspections, log sensor readings, and report field issues.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isManager && (
            <Link
              to="/maintenance"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Work</span>
            </Link>
          )}

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-slate-950 font-bold text-xs transition backdrop-blur-xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How It Works</span>
          </button>

          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Run Health Check</span>
          </button>
        </div>
      </div>

      {/* For Company Owner: Dedicated Section for Equipment Work Orders Generated by Manager */}
      {isOwner && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Wrench className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Equipment Work Orders Generated by Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  Owner Review
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({upcomingMaintenance.length} total)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All equipment work orders and maintenance tasks scheduled by your Company Manager.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {upcomingMaintenance.length > 2 && (
                <button
                  onClick={() => setIsWorkOrdersExpanded(!isWorkOrdersExpanded)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-950 text-xs font-bold transition cursor-pointer"
                  title={isWorkOrdersExpanded ? "Collapse to small box" : "View full list"}
                >
                  <span>{isWorkOrdersExpanded ? 'Show Less' : `View Full (${upcomingMaintenance.length})`}</span>
                  {isWorkOrdersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}

              <Link
                to="/maintenance"
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 w-fit shadow-xs"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {upcomingMaintenance.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No work orders generated by the manager yet. All company machines are operational.
              </div>
            ) : (
              (isWorkOrdersExpanded ? upcomingMaintenance : upcomingMaintenance.slice(0, 2)).map((order) => (
                <div key={order._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {order.equipmentId ? `${order.equipmentId.equipmentId || ''} - ${order.equipmentId.name}` : 'Mining Equipment'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {order.maintenanceType}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">{order.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="text-slate-700 font-semibold">
                          👤 Generated by: <strong className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">{order.createdByName || 'Company Manager'}</strong>
                        </span>
                        <span>•</span>
                        <span>📅 Scheduled: {new Date(order.scheduledDate).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span>💰 Est. Cost: ₹{order.cost?.toLocaleString('en-IN') || 0}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/maintenance"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition shrink-0 text-center"
                  >
                    Review Work Order →
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Bottom Expand / Collapse Arrow Bar */}
          {upcomingMaintenance.length > 2 && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsWorkOrdersExpanded(!isWorkOrdersExpanded)}
                className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>
                  {isWorkOrdersExpanded
                    ? 'Show Less (Collapse to Small Box)'
                    : `View Full List (${upcomingMaintenance.length} Work Orders)`}
                </span>
                {isWorkOrdersExpanded ? (
                  <ChevronUp className="w-4 h-4 text-amber-700" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-amber-700" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Dashboard KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isTechnician ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-4`}>
        {/* Equipment Card */}
        <Link 
          to="/equipment"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.equipment?.total ?? 0}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-600">
            <span className="text-emerald-600 font-bold">🟢 {stats?.equipment?.active ?? 0} Good</span>
            <span>•</span>
            <span className="text-rose-600 font-bold">🔴 {stats?.equipment?.breakdown ?? 0} Problem</span>
          </div>
        </Link>

        {/* Tyres Card */}
        <Link 
          to="/tyres"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tyres</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <CircleDot className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats?.tyres?.total ?? 0}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-600">
            <span className="text-emerald-600 font-bold">🟢 {stats?.tyres?.good ?? 0} Good</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">🟡 {stats?.tyres?.warning ?? 0} Watch</span>
          </div>
        </Link>

        {/* Today's Tasks / Checks Card */}
        <Link 
          to="/check-equipment"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Checks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            Ready
          </p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Inspect machines & tyres
          </p>
        </Link>

        {/* Maintenance Card - Hidden for Technicians */}
        {!isTechnician && (
          <Link 
            to="/maintenance"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition shadow-xs group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maintenance</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {(stats?.maintenance?.scheduled ?? 0) + (stats?.maintenance?.inProgress ?? 0)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-slate-600">
              <span className="text-purple-600 font-bold">In Progress: {stats?.maintenance?.inProgress ?? 0}</span>
            </div>
          </Link>
        )}

        {/* Problems Card */}
        <Link 
          to="/problems"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 transition shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Problems</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {stats?.alerts?.unresolved ?? alerts.filter(a => !a.isResolved).length}
          </p>
          <p className="text-[11px] text-rose-700 mt-2 font-bold flex items-center gap-1">
            <span>{stats?.alerts?.critical ?? 0} urgent items</span>
          </p>
        </Link>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider px-2">
          ⚡ Quick Actions:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Link
              to="/companies"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold transition shadow-xs hover:bg-slate-800"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Manage Mining Companies</span>
            </Link>
          )}

          {(isSuperAdmin || isOwner) && (
            <Link
              to="/users"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold transition"
            >
              <span>Personnel & Roles</span>
            </Link>
          )}

          <Link
            to="/check-equipment"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold transition"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Check Equipment</span>
          </Link>

          <Link
            to="/check-tyre"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold transition"
          >
            <CircleDot className="w-3.5 h-3.5 text-amber-500" />
            <span>Check Tyre</span>
          </Link>

          {!isTechnician && (
            <Link
              to="/maintenance"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 text-xs font-bold transition"
            >
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              <span>{isOwner ? 'Review Work Orders' : 'Schedule Repair'}</span>
            </Link>
          )}

          <Link
            to="/problems"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition border border-rose-200"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isTechnician ? 'Report / View Problems' : 'Review Problems'}</span>
          </Link>

          <Link
            to="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <span>View All History →</span>
          </Link>
        </div>
      </div>

      {/* Visual Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Fleet Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Equipment Health Summary</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Current Status</span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: '🟢 Good', count: stats?.equipment?.active ?? 0, fill: '#10B981' },
                  { name: '🟡 Needs Check', count: stats?.equipment?.underMaintenance ?? 0, fill: '#F59E0B' },
                  { name: '🔴 Problem', count: stats?.equipment?.breakdown ?? 0, fill: '#EF4444' }
                ]}
                margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
              >
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} Units`, 'Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tyre Health Condition Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-amber-500" />
              <span>Tyre Condition Status</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Inventory</span>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '🟢 Good (Healthy)', value: stats?.tyres?.good ?? 0 },
                    { name: '🟡 Needs Checking', value: stats?.tyres?.warning ?? 0 },
                    { name: '🔴 Problem (Replace)', value: stats?.tyres?.critical ?? 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Equipment & Urgent Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment List Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Company Machines</span>
            </h3>
            <Link to="/equipment" className="text-xs font-bold text-amber-600 hover:text-amber-700">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEquipment.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No equipment found. Add your first machine in the Equipment section.
              </div>
            ) : (
              recentEquipment.map((eq) => (
                <div key={eq._id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {eq.equipmentId?.substring(0, 3) || 'EQ'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{eq.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {eq.type} • {eq.operatingHours || 0} Hours
                      </p>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(eq.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Problems / Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Active Problems Requiring Attention</span>
            </h3>
            <Link to="/problems" className="text-xs font-bold text-rose-600 hover:text-rose-700">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.filter(a => !a.isResolved).length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">All Systems Clear</p>
                <p className="text-[11px] text-slate-400">No active equipment or tyre problems reported.</p>
              </div>
            ) : (
              alerts.filter(a => !a.isResolved).slice(0, 4).map((alert) => (
                <div key={alert._id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                        {alert.severity === 'Critical' ? '🔴 Critical' : '🟡 Warning'}
                      </span>
                      <p className="text-xs font-bold text-slate-900">{alert.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                  <button
                    onClick={() => resolveAlert(alert._id)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition shrink-0 cursor-pointer"
                  >
                    Fix ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <HelpGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default Dashboard;
