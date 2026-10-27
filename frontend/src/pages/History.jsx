import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  Truck, 
  CircleDot, 
  Wrench, 
  AlertTriangle,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { historyAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const History = () => {
  const { isTechnician } = useAuth();
  const { showToast } = useToast();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.getAll({
        filterType: filterType === 'All' ? undefined : filterType
      });
      setHistoryItems(res.data?.data || []);
    } catch (err) {
      showToast('Could not load history records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType]);

  const getStatusBadge = (status) => {
    if (status === 'Good') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          🟢 Good
        </span>
      );
    }
    if (status === 'Needs Checking') {
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

  const getCategoryIcon = (category) => {
    if (category.includes('Equipment')) return <Truck className="w-4 h-4 text-blue-500" />;
    if (category.includes('Tyre')) return <CircleDot className="w-4 h-4 text-amber-500" />;
    if (category.includes('Maintenance')) return <Wrench className="w-4 h-4 text-purple-500" />;
    return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  };

  const filtered = historyItems.filter((item) => {
    const title = item.title || '';
    const details = item.details || '';
    const by = item.performedBy || '';
    const s = searchTerm.toLowerCase();
    return title.toLowerCase().includes(s) || details.toLowerCase().includes(s) || by.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HistoryIcon className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Activity History</h1>
          </div>
          <p className="text-sm text-slate-500">
            Chronological audit record of every inspection check, maintenance repair, and problem resolution.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {(isTechnician
            ? ['All', 'Equipment Check', 'Tyre Check', 'Problem']
            : ['All', 'Equipment Check', 'Tyre Check', 'Maintenance', 'Problem']
          ).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === type
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'All' ? 'All Activities' : type}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* History Timeline / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Chronological Log ({filtered.length} entries)
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Latest first</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading timeline...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No history records found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.details}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <UserCheck className="w-3 h-3" /> Logged by <span className="text-slate-700 font-medium">{item.performedBy}</span>
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  {getStatusBadge(item.status)}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
