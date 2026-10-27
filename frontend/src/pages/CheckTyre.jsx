import React, { useState, useEffect } from 'react';
import { 
  CircleDot, 
  Plus, 
  Search, 
  Gauge, 
  Ruler, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { inspectionAPI, tyreAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CheckTyre = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [inspections, setInspections] = useState([]);
  const [tyresList, setTyresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tyreId: '',
    treadDepth: 75,
    pressure: 105,
    temperature: 45,
    visibleDamage: 'None',
    wearCondition: 'Even Wear',
    tyreOverallCondition: 'Good',
    notes: '',
    actionRecommended: 'Tyre pressure and tread are within safe limits'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, tyreRes] = await Promise.all([
        inspectionAPI.getAll({ inspectionType: 'Tyre' }),
        tyreAPI.getAll()
      ]);
      setInspections(inspRes.data?.data || []);
      setTyresList(tyreRes.data?.data || []);
      if (tyreRes.data?.data?.length > 0 && !formData.tyreId) {
        setFormData(prev => ({ ...prev, tyreId: tyreRes.data.data[0]._id }));
      }
    } catch (err) {
      showToast('Could not load tyre checks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tyreId) {
      showToast('Please select a tyre to inspect', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await inspectionAPI.create({
        ...formData,
        inspectionType: 'Tyre'
      });
      showToast('Tyre check recorded successfully! 🟢', 'success');
      setShowModal(false);
      // Reset
      setFormData({
        tyreId: tyresList[0]?._id || '',
        treadDepth: 75,
        pressure: 105,
        temperature: 45,
        visibleDamage: 'None',
        wearCondition: 'Even Wear',
        tyreOverallCondition: 'Good',
        notes: '',
        actionRecommended: 'Tyre pressure and tread are within safe limits'
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record tyre check', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (condition) => {
    if (condition === 'Good') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Good
        </span>
      );
    }
    if (condition === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          🟡 Needs Checking
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
        🔴 Problem
      </span>
    );
  };

  const filtered = inspections.filter(item => {
    const code = item.tyreId?.tyreId || '';
    const pos = item.tyreId?.position || '';
    const notes = item.notes || '';
    const s = searchTerm.toLowerCase();
    return code.toLowerCase().includes(s) || pos.toLowerCase().includes(s) || notes.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CircleDot className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Check Tyre</h1>
          </div>
          <p className="text-sm text-slate-500">
            Record tyre tread depth, air pressure (PSI), wear patterns, and safety status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Tyre Check</span>
        </button>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🟢
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Healthy Tyres</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.tyreOverallCondition === 'Good').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            🟡
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Low Tread / Pressure</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.tyreOverallCondition === 'Warning').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            🔴
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Critical Issues</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.tyreOverallCondition === 'Critical').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tyre checks by tyre code, wheel position, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tyre Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Recent Tyre Inspections</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading tyre checks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No tyre inspections logged. Click <strong>"New Tyre Check"</strong> to log pressure and tread depth.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tyre Identification</th>
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tread & Pressure</th>
                  <th className="px-4 py-3">Wear & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CircleDot className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="font-bold text-slate-900">{item.tyreId?.tyreId || 'Tyre'}</p>
                          <p className="text-[11px] text-slate-400">
                            {item.tyreId?.brand} {item.tyreId?.model} • Pos: <span className="font-mono text-slate-600">{item.tyreId?.position || 'Spare'}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(item.inspectionDate || item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.tyreOverallCondition)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-semibold text-slate-900">
                          <Ruler className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.treadDepth ?? 'N/A'} mm</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-slate-900">
                          <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{item.pressure ?? 'N/A'} PSI</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium">
                        {item.visibleDamage !== 'None' ? `⚠️ ${item.visibleDamage} - ` : ''}
                        {item.notes || 'Normal condition'}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3" /> Checked by {item.technicianId?.name || 'Inspector'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - New Tyre Check */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Record Tyre Check</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tyre Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Tyre <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.tyreId}
                  onChange={(e) => setFormData({ ...formData, tyreId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Choose Tyre --</option>
                  {tyresList.map((tyre) => (
                    <option key={tyre._id} value={tyre._id}>
                      {tyre.tyreId} - {tyre.brand} {tyre.model} (Pos: {tyre.position || 'Spare'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tyre Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '🟢 Good', val: 'Good', desc: 'Normal wear' },
                    { label: '🟡 Needs Checking', val: 'Warning', desc: 'Low pressure/tread' },
                    { label: '🔴 Problem', val: 'Critical', desc: 'Replace or Repair' }
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.val}
                      onClick={() => setFormData({ ...formData, tyreOverallCondition: s.val })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        formData.tyreOverallCondition === s.val
                          ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[10px] font-normal text-slate-400 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Measurements */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tread Depth (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    step="0.5"
                    value={formData.treadDepth}
                    onChange={(e) => setFormData({ ...formData, treadDepth: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Normal: 40 - 100 mm</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Air Pressure (PSI)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={formData.pressure}
                    onChange={(e) => setFormData({ ...formData, pressure: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Normal: 90 - 120 PSI</p>
                </div>
              </div>

              {/* Physical check */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visible Damage</label>
                  <select
                    value={formData.visibleDamage}
                    onChange={(e) => setFormData({ ...formData, visibleDamage: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="None">None (Clean)</option>
                    <option value="Sidewall Cuts">Sidewall Cuts</option>
                    <option value="Bulges">Bulges / Blisters</option>
                    <option value="Bead Separation">Bead Separation</option>
                    <option value="Severe Cracking">Severe Cracking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wear Pattern</label>
                  <select
                    value={formData.wearCondition}
                    onChange={(e) => setFormData({ ...formData, wearCondition: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Even Wear">Even Wear</option>
                    <option value="Shoulder Wear">Shoulder Wear</option>
                    <option value="Center Wear">Center Wear</option>
                    <option value="One-sided Wear">One-sided Wear</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observation Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Pressure verified with digital gauge, sidewall inspected..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Tyre Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckTyre;
