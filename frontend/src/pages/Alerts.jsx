import React, { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { useAlerts } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Filter, 
  ShieldAlert, 
  Clock, 
  Layers, 
  Truck, 
  CircleDot, 
  Search,
  CheckCheck,
  Radio,
  Flame,
  Gauge,
  Wrench
} from 'lucide-react';

const Alerts = () => {
  const { resolveAlert, triggerScan, loading: scanning, unresolvedCount, criticalCount } = useAlerts();
  const toast = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (resolvedFilter) params.isResolved = resolvedFilter;

      const res = await alertAPI.getAll(params);
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load alerts', err);
      toast.error(err.response?.data?.message || 'Failed to load telemetry warnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, categoryFilter, resolvedFilter]);

  const handleResolve = async (id) => {
    try {
      setActionLoadingId(id);
      await resolveAlert(id);
      toast.success('Safety anomaly marked as resolved.');
      await fetchAlerts();
    } catch (err) {
      toast.error('Failed to resolve alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunScan = async () => {
    try {
      toast.info('Initiating real-time telemetry anomaly scan...');
      await triggerScan();
      toast.success('Telemetry scan complete! Sensor states evaluated.');
      await fetchAlerts();
    } catch (err) {
      toast.error('Telemetry scan failed to complete');
    }
  };

  // Filter by search
  const filteredAlerts = alerts.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const msg = item.message?.toLowerCase() || '';
    const cat = item.category?.toLowerCase() || '';
    const eqName = item.equipmentId?.name?.toLowerCase() || '';
    const eqId = item.equipmentId?.equipmentId?.toLowerCase() || '';
    const tyreId = item.tyreId?.tyreId?.toLowerCase() || '';
    return msg.includes(s) || cat.includes(s) || eqName.includes(s) || eqId.includes(s) || tyreId.includes(s);
  });

  const activeCount = alerts.filter(a => !a.isResolved).length;
  const criticalInView = alerts.filter(a => !a.isResolved && a.severity === 'Critical').length;
  const highInView = alerts.filter(a => !a.isResolved && a.severity === 'High').length;
  const resolvedInView = alerts.filter(a => a.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            <span>Telemetry Anomaly & Safety Warnings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated sensor monitoring across critical tyre pressure drops, severe heat accumulation, and maintenance overruns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Alert Stream"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Analyzing Fleet...' : 'Trigger Telemetry Scan'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Critical Anomalies</p>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600 mt-1.5">{criticalCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Active Warnings</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 mt-1.5">{unresolvedCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Sensor Status</p>
            <Radio className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">Live Sync</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Resolved Archive</p>
            <CheckCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{resolvedFilter === 'true' ? alerts.length : 'Archived'}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search alerts by warning message, equipment unit, or tyre ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
          >
            <option value="false">Active (Unresolved)</option>
            <option value="true">Resolved Archive</option>
            <option value="">All Alert Records</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
          >
            <option value="">All Alert Types</option>
            <option value="Tyre Pressure">Tyre Pressure</option>
            <option value="Tread Wear">Tread Wear</option>
            <option value="Maintenance Due">Maintenance Due</option>
            <option value="Equipment Breakdown">Equipment Breakdown</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No active anomalies flagged!</h3>
            <p className="text-slate-500 mt-1">All telemetry sensors, pressures, temperatures, and maintenance cycles are within nominal safety thresholds.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((item) => {
            const isCrit = item.severity === 'Critical';
            const isHigh = item.severity === 'High';

            return (
              <div
                key={item._id}
                className={`industrial-card p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 hover:shadow-md ${
                  isCrit
                    ? 'border-l-rose-500 bg-rose-50/50 hover:border-rose-400'
                    : isHigh
                    ? 'border-l-amber-500 bg-amber-50/50 hover:border-amber-400'
                    : 'border-l-sky-500 bg-sky-50/40 hover:border-sky-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                      isCrit
                        ? 'bg-rose-100 text-rose-600 border-rose-200 animate-pulse'
                        : isHigh
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-sky-100 text-sky-700 border-sky-200'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.severity} type="severity" />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold uppercase">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 mt-1">{item.message}</p>

                    <div className="pt-1 flex items-center gap-4 text-xs font-mono text-slate-500 flex-wrap">
                      {item.equipmentId && (
                        <span className="flex items-center gap-1 text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          <Truck className="w-3 h-3" />
                          <span>{item.equipmentId.equipmentId} ({item.equipmentId.name})</span>
                        </span>
                      )}
                      {item.tyreId && (
                        <span className="flex items-center gap-1 text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded border border-sky-200 font-medium">
                          <CircleDot className="w-3 h-3" />
                          <span>{item.tyreId.tyreId} ({item.tyreId.position})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!item.isResolved ? (
                    <button
                      onClick={() => handleResolve(item._id)}
                      disabled={actionLoadingId === item._id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{actionLoadingId === item._id ? 'Resolving...' : 'Resolve Alert'}</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />
                        <span>Resolved</span>
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        By {item.resolvedBy?.name || 'Operator'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
