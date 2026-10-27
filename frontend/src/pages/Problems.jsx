import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Clock, 
  Truck, 
  CircleDot, 
  ShieldCheck,
  RefreshCw,
  Plus,
  Camera,
  Image as ImageIcon,
  X,
  Upload
} from 'lucide-react';
import { alertAPI, equipmentAPI, tyreAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAlerts } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

const Problems = () => {
  const toast = useToast();
  const { fetchAlerts } = useAlerts();
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [tyresList, setTyresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Active'); // 'Active' or 'All'
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvingId, setResolvingId] = useState(null);

  // Report Problem Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submittingProblem, setSubmittingProblem] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    message: '',
    severity: 'High',
    category: 'Equipment Health',
    equipmentId: '',
    tyreId: '',
    photoUrl: ''
  });

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const [alertRes, eqRes, tyreRes] = await Promise.all([
        alertAPI.getAll({
          isResolved: filterStatus === 'Active' ? false : undefined
        }),
        equipmentAPI.getAll().catch(() => ({ data: { data: [] } })),
        tyreAPI.getAll().catch(() => ({ data: { data: [] } }))
      ]);
      setProblems(alertRes.data?.data || []);
      setEquipmentList(eqRes.data?.data || []);
      setTyresList(tyreRes.data?.data || []);
    } catch (err) {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [filterStatus]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size exceeds 2MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportForm((prev) => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.message.trim()) {
      toast.error('Please enter problem title and detailed observations');
      return;
    }
    try {
      setSubmittingProblem(true);
      await alertAPI.create({
        ...reportForm,
        equipmentId: reportForm.equipmentId || undefined,
        tyreId: reportForm.tyreId || undefined
      });
      toast.success('Equipment problem reported and alerted! 🚨');
      setIsReportModalOpen(false);
      setReportForm({
        title: '',
        message: '',
        severity: 'High',
        category: 'Equipment Health',
        equipmentId: '',
        tyreId: '',
        photoUrl: ''
      });
      await fetchProblems();
      if (fetchAlerts) fetchAlerts().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit problem report');
    } finally {
      setSubmittingProblem(false);
    }
  };

  const handleMarkAsFixed = async (id) => {
    setResolvingId(id);
    try {
      await alertAPI.resolve(id);
      toast.success('Problem marked as fixed! 🟢');
      // Optimistically update problem item in state
      setProblems((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, isResolved: true, resolvedAt: new Date().toISOString() }
            : item
        )
      );
      if (fetchAlerts) fetchAlerts().catch(() => {});
      await fetchProblems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resolve problem');
    } finally {
      setResolvingId(null);
    }
  };

  const filtered = problems.filter((p) => {
    const title = p.title || '';
    const msg = p.message || '';
    const eq = p.equipmentId?.name || '';
    const tyre = p.tyreId?.tyreId || '';
    const s = searchTerm.toLowerCase();
    return title.toLowerCase().includes(s) || msg.toLowerCase().includes(s) || eq.toLowerCase().includes(s) || tyre.toLowerCase().includes(s);
  });

  const activeCount = problems.filter(p => !p.isResolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-slate-900">Equipment & Tyre Problems</h1>
          </div>
          <p className="text-sm text-slate-500">
            Track active machinery issues, tyre damage warnings, report new problems with photos, and mark fixed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Report Problem</span>
          </button>
          <button
            onClick={fetchProblems}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('Active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              filterStatus === 'Active'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Active Problems</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filterStatus === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All History (Including Fixed)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
          Checking problem logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Active Problems Found!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All equipment and tyres are operating normally. Click "Report Problem" above to log a new defect.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCritical = item.severity === 'Critical' || item.severity === 'High';
            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.isResolved 
                    ? 'border-slate-200 bg-slate-50/50 opacity-80' 
                    : isCritical 
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-200' 
                      : 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Photo thumbnail if uploaded */}
                  {item.photoUrl ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative group cursor-pointer">
                      <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          🟢 Fixed
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          🔴 Problem (Urgent)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          🟡 Needs Checking
                        </span>
                      )}

                      <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl">{item.message}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                      {item.equipmentId && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {item.equipmentId.name} ({item.equipmentId.equipmentId})
                        </span>
                      )}
                      {item.tyreId && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <CircleDot className="w-3.5 h-3.5 text-amber-500" />
                          Tyre {item.tyreId.tyreId} (Pos: {item.tyreId.position})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Reported on {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {!item.isResolved ? (
                    <button
                      onClick={() => handleMarkAsFixed(item._id)}
                      disabled={resolvingId === item._id}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{resolvingId === item._id ? 'Saving...' : 'Mark as Fixed'}</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-4 h-4" /> Issue Resolved
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString() : 'Completed'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Problem Modal with Photo Upload */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-slate-900">Report Equipment / Tyre Problem</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Problem Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic leak near rear cylinder / Tyre sidewall crack"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Machine</label>
                  <select
                    value={reportForm.equipmentId}
                    onChange={(e) => setReportForm({ ...reportForm, equipmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- No specific machine --</option>
                    {equipmentList.map((eq) => (
                      <option key={eq._id} value={eq._id}>
                        {eq.equipmentId} - {eq.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Tyre</label>
                  <select
                    value={reportForm.tyreId}
                    onChange={(e) => setReportForm({ ...reportForm, tyreId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">-- No specific tyre --</option>
                    {tyresList.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tyreId} ({t.position})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Critical">🔴 Critical (Immediate Stop)</option>
                    <option value="High">🟠 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low / Watch Item</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Equipment Health">Equipment Health</option>
                    <option value="Tyre Pressure">Tyre Pressure</option>
                    <option value="Tyre Temperature">Tyre Temperature</option>
                    <option value="Tyre Tread">Tyre Tread Wear</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Inspection Required">Inspection Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Observations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the defect, unusual sounds, vibration, or visible damage..."
                  value={reportForm.message}
                  onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photo Upload / Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span>Attach Problem Photo (Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-400">or enter image URL below:</span>
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={reportForm.photoUrl}
                  onChange={(e) => setReportForm({ ...reportForm, photoUrl: e.target.value })}
                  className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                />
                {reportForm.photoUrl && (
                  <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={reportForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProblem}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs disabled:opacity-50"
                >
                  {submittingProblem ? 'Reporting...' : 'Submit Problem Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problems;
