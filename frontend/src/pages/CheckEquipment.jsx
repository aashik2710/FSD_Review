import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Truck, 
  Calendar, 
  UserCheck, 
  FileText,
  Clock
} from 'lucide-react';
import { inspectionAPI, equipmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CheckEquipment = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [inspections, setInspections] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    equipmentId: '',
    engineCondition: 'Good',
    brakeCondition: 'Good',
    hydraulicSystem: 'Good',
    electricalSystem: 'Good',
    oilLevel: 'Normal',
    coolingSystem: 'Normal',
    equipmentOverallCondition: 'Good',
    notes: '',
    actionRecommended: 'Machine is safe and ready for operation'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, eqRes] = await Promise.all([
        inspectionAPI.getAll({ inspectionType: 'Equipment' }),
        equipmentAPI.getAll()
      ]);
      setInspections(inspRes.data?.data || []);
      setEquipmentList(eqRes.data?.data || []);
      if (eqRes.data?.data?.length > 0 && !formData.equipmentId) {
        setFormData(prev => ({ ...prev, equipmentId: eqRes.data.data[0]._id }));
      }
    } catch (err) {
      showToast('Could not load equipment checks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipmentId) {
      showToast('Please select a piece of equipment', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await inspectionAPI.create({
        ...formData,
        inspectionType: 'Equipment'
      });
      showToast('Equipment check recorded successfully! 🟢', 'success');
      setShowModal(false);
      // Reset
      setFormData({
        equipmentId: equipmentList[0]?._id || '',
        engineCondition: 'Good',
        brakeCondition: 'Good',
        hydraulicSystem: 'Good',
        electricalSystem: 'Good',
        oilLevel: 'Normal',
        coolingSystem: 'Normal',
        equipmentOverallCondition: 'Good',
        notes: '',
        actionRecommended: 'Machine is safe and ready for operation'
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save check', 'error');
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
    const name = item.equipmentId?.name || '';
    const eqCode = item.equipmentId?.equipmentId || '';
    const notes = item.notes || '';
    const s = searchTerm.toLowerCase();
    return name.toLowerCase().includes(s) || eqCode.toLowerCase().includes(s) || notes.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Check Equipment</h1>
          </div>
          <p className="text-sm text-slate-500">
            Perform routine safety and health inspections on heavy mining machinery.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Equipment Check</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🟢
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Passed / Good</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.equipmentOverallCondition === 'Good').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            🟡
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Needs Attention</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.equipmentOverallCondition === 'Warning').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            🔴
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Problems</p>
            <p className="text-lg font-bold text-slate-900">
              {inspections.filter(i => i.equipmentOverallCondition === 'Critical').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search checks by machine name, equipment ID, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Checks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Recent Equipment Inspections</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading inspection records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No equipment checks found. Click <strong>"New Equipment Check"</strong> above to record your first inspection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Inspection Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">System Checks</th>
                  <th className="px-4 py-3">Inspector / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900">{item.equipmentId?.name || 'Machine'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.equipmentId?.equipmentId || 'N/A'}</p>
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
                      {getStatusBadge(item.equipmentOverallCondition)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Engine: {item.engineCondition}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Brakes: {item.brakeCondition}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Oil: {item.oilLevel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium">{item.notes || 'Routine check passed'}</p>
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

      {/* Modal - New Equipment Check */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Record Equipment Check</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Equipment Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Machine <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.equipmentId}
                  onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Choose Equipment --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.equipmentId} - {eq.name} ({eq.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Overall Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Overall Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '🟢 Good', val: 'Good', desc: 'No issues found' },
                    { label: '🟡 Needs Checking', val: 'Warning', desc: 'Minor issue' },
                    { label: '🔴 Problem', val: 'Critical', desc: 'Needs repair' }
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.val}
                      onClick={() => setFormData({ ...formData, equipmentOverallCondition: s.val })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        formData.equipmentOverallCondition === s.val
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

              {/* System Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Engine Condition</label>
                  <select
                    value={formData.engineCondition}
                    onChange={(e) => setFormData({ ...formData, engineCondition: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brake System</label>
                  <select
                    value={formData.brakeCondition}
                    onChange={(e) => setFormData({ ...formData, brakeCondition: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hydraulics</label>
                  <select
                    value={formData.hydraulicSystem}
                    onChange={(e) => setFormData({ ...formData, hydraulicSystem: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Oil Level</label>
                  <select
                    value={formData.oilLevel}
                    onChange={(e) => setFormData({ ...formData, oilLevel: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                    <option value="Critical Low">Critical Low</option>
                    <option value="Overfilled">Overfilled</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Engine sound normal, oil level checked, brake response tested..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action recommended */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Next Action Recommended</label>
                <input
                  type="text"
                  placeholder="e.g. Safe for operation or Schedule oil change"
                  value={formData.actionRecommended}
                  onChange={(e) => setFormData({ ...formData, actionRecommended: e.target.value })}
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
                  {submitting ? 'Saving...' : 'Save Equipment Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckEquipment;
