import React, { useState, useEffect } from 'react';
import { 
  inspectionAPI, 
  equipmentAPI, 
  tyreAPI 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  ClipboardCheck, 
  Plus, 
  Truck, 
  CircleDot, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Search, 
  Filter,
  Eye,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Thermometer,
  Ruler,
  Layers
} from 'lucide-react';

const Inspections = () => {
  const { user } = useAuth();
  const { triggerScan } = useAlerts();
  const toast = useToast();

  const [inspections, setInspections] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [tyres, setTyres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [inspectionType, setInspectionType] = useState('Tyre');
  const [formData, setFormData] = useState({
    equipmentId: '',
    tyreId: '',
    // Equipment Fields
    engineCondition: 'Good',
    brakeCondition: 'Good',
    hydraulicSystem: 'Good',
    electricalSystem: 'Good',
    oilLevel: 'Normal',
    coolingSystem: 'Normal',
    equipmentOverallCondition: 'Good',
    // Tyre Fields
    treadDepth: 75,
    pressure: 102,
    temperature: 65,
    visibleDamage: 'None',
    wearCondition: 'Even Wear',
    tyreOverallCondition: 'Good',
    // Shared
    notes: '',
    actionRecommended: 'Routine operation permitted'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType) params.inspectionType = filterType;

      const [inspRes, eqRes, tyreRes] = await Promise.all([
        inspectionAPI.getAll(params),
        equipmentAPI.getAll(),
        tyreAPI.getAll()
      ]);
      setInspections(inspRes.data.data || []);
      setEquipmentList(eqRes.data.data || []);
      setTyres(tyreRes.data.data || []);
    } catch (err) {
      console.error('Failed to load inspections', err);
      toast.error(err.response?.data?.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        inspectionType,
        equipmentId: inspectionType === 'Equipment' ? formData.equipmentId : null,
        tyreId: inspectionType === 'Tyre' ? formData.tyreId : null,
        notes: formData.notes,
        actionRecommended: formData.actionRecommended
      };

      if (inspectionType === 'Equipment') {
        payload.engineCondition = formData.engineCondition;
        payload.brakeCondition = formData.brakeCondition;
        payload.hydraulicSystem = formData.hydraulicSystem;
        payload.electricalSystem = formData.electricalSystem;
        payload.oilLevel = formData.oilLevel;
        payload.coolingSystem = formData.coolingSystem;
        payload.equipmentOverallCondition = formData.equipmentOverallCondition;
      } else {
        payload.treadDepth = Number(formData.treadDepth);
        payload.pressure = Number(formData.pressure);
        payload.temperature = Number(formData.temperature);
        payload.visibleDamage = formData.visibleDamage;
        payload.wearCondition = formData.wearCondition;
        payload.tyreOverallCondition = formData.tyreOverallCondition;
      }

      await inspectionAPI.create(payload);
      toast.success('Inspection report logged successfully!');
      setIsModalOpen(false);
      await triggerScan();
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inspection');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter inspections
  const filteredInspections = inspections.filter((item) => {
    const s = search.toLowerCase();
    const matchesSearch = 
      !search ||
      item.inspectionNumber?.toLowerCase().includes(s) ||
      item.actionRecommended?.toLowerCase().includes(s) ||
      item.notes?.toLowerCase().includes(s) ||
      item.equipmentId?.name?.toLowerCase().includes(s) ||
      item.equipmentId?.equipmentId?.toLowerCase().includes(s) ||
      item.tyreId?.tyreId?.toLowerCase().includes(s);

    const condition = item.inspectionType === 'Tyre' ? item.tyreOverallCondition : item.equipmentOverallCondition;
    const matchesCondition = !conditionFilter || condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const totalInspections = inspections.length;
  const tyreInspections = inspections.filter(i => i.inspectionType === 'Tyre').length;
  const equipmentInspections = inspections.filter(i => i.inspectionType === 'Equipment').length;
  const anomalyInspections = inspections.filter(i => 
    (i.tyreOverallCondition === 'Warning' || i.tyreOverallCondition === 'Critical' ||
     i.equipmentOverallCondition === 'Warning' || i.equipmentOverallCondition === 'Critical')
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <ClipboardCheck className="w-6 h-6 text-amber-500" />
            <span>Field Inspection Telemetry Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct and review comprehensive physical diagnostics, OTR tread measurements, and mechanical health assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Inspections"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (equipmentList.length > 0 && !formData.equipmentId) {
                setFormData(prev => ({ ...prev, equipmentId: equipmentList[0]._id }));
              }
              if (tyres.length > 0 && !formData.tyreId) {
                setFormData(prev => ({ ...prev, tyreId: tyres[0]._id }));
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Log Inspection</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Total Audits</p>
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1.5">{totalInspections}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">OTR Tyre Audits</p>
            <CircleDot className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">{tyreInspections}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Equipment Fleet Audits</p>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{equipmentInspections}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Wear Anomalies</p>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600 mt-1.5">{anomalyInspections}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search inspections by Report #, asset name, technician, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
          >
            <option value="">All Categories (Tyres & Fleet)</option>
            <option value="Tyre">OTR Tyres Only</option>
            <option value="Equipment">Heavy Equipment Only</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none shadow-xs"
          >
            <option value="">All Health Ratings</option>
            <option value="Good">Good Condition</option>
            <option value="Warning">Warning Flagged</option>
            <option value="Critical">Critical Defect</option>
          </select>
        </div>
      </div>

      {/* Inspection Reports Timeline */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs">
          No inspection logs matched your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInspections.map((insp) => {
            const condition = insp.inspectionType === 'Tyre' ? insp.tyreOverallCondition : insp.equipmentOverallCondition;
            const isCrit = condition === 'Critical';
            const isWarn = condition === 'Warning';

            return (
              <div
                key={insp._id}
                className={`industrial-card p-5 border-l-4 transition hover:border-slate-300 hover:shadow-md ${
                  isCrit
                    ? 'border-l-rose-500 bg-rose-50/40'
                    : isWarn
                    ? 'border-l-amber-500 bg-amber-50/40'
                    : 'border-l-emerald-500 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-amber-600">
                      {insp.inspectionType === 'Tyre' ? (
                        <CircleDot className="w-5 h-5" />
                      ) : (
                        <Truck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                          {insp.inspectionNumber || 'INSP-LOG'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                          {insp.inspectionType} Inspection
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {insp.inspectionType === 'Tyre'
                          ? `OTR Tyre: ${insp.tyreId?.tyreId || 'Unassigned'} (${insp.tyreId?.brand || ''} ${insp.tyreId?.size || ''})`
                          : `Equipment: ${insp.equipmentId?.equipmentId || ''} - ${insp.equipmentId?.name || 'Unit'}`}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={condition} type="condition" />
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(insp.inspectionDate || insp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Inspection Telemetry Specs */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  {insp.inspectionType === 'Tyre' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Tread Depth</span>
                        <p className="text-amber-600 font-bold mt-0.5">{insp.treadDepth} mm</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Pressure</span>
                        <p className="text-sky-700 font-bold mt-0.5">{insp.pressure} PSI</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Wear Pattern</span>
                        <p className="text-slate-800 font-bold mt-0.5">{insp.wearCondition || 'Even Wear'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Physical Damage</span>
                        <p className={`font-bold mt-0.5 ${insp.visibleDamage !== 'None' ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {insp.visibleDamage || 'None'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Engine</span>
                        <p className="text-slate-800 font-bold mt-0.5">{insp.engineCondition || 'Good'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Brakes</span>
                        <p className="text-slate-800 font-bold mt-0.5">{insp.brakeCondition || 'Good'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Hydraulics</span>
                        <p className="text-slate-800 font-bold mt-0.5">{insp.hydraulicSystem || 'Good'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 text-[10px] uppercase">Cooling</span>
                        <p className="text-slate-800 font-bold mt-0.5">{insp.coolingSystem || 'Normal'}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Recommendation & Technician */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <p className="text-slate-700 font-mono flex items-center gap-1.5">
                    <span className="text-amber-700 font-bold">Action:</span>
                    <span>{insp.actionRecommended}</span>
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{insp.technicianId?.name || 'Field Inspector'}</span>
                    </span>

                    <button
                      onClick={() => setSelectedInspection(insp)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-amber-600" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspection Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                  {selectedInspection.inspectionNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedInspection.inspectionType} Diagnostic Audit
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Conducted {new Date(selectedInspection.inspectionDate).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Inspected Asset</span>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {selectedInspection.inspectionType === 'Tyre'
                      ? `OTR Tyre: ${selectedInspection.tyreId?.tyreId} (${selectedInspection.tyreId?.brand})`
                      : `Equipment: ${selectedInspection.equipmentId?.equipmentId} - ${selectedInspection.equipmentId?.name}`}
                  </p>
                </div>
                <StatusBadge 
                  status={selectedInspection.inspectionType === 'Tyre' ? selectedInspection.tyreOverallCondition : selectedInspection.equipmentOverallCondition}
                  type="condition"
                />
              </div>

              {selectedInspection.inspectionType === 'Tyre' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Tread Depth:</span>
                    <p className="text-amber-600 font-bold mt-0.5">{selectedInspection.treadDepth} mm</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Pressure:</span>
                    <p className="text-sky-700 font-bold mt-0.5">{selectedInspection.pressure} PSI</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Temperature:</span>
                    <p className="text-rose-600 font-bold mt-0.5">{selectedInspection.temperature} °C</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Wear Condition:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.wearCondition}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
                    <span className="text-slate-500 text-[10px]">Physical / Sidewall Damage:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.visibleDamage || 'None'}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Engine Condition:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.engineCondition}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Braking System:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.brakeCondition}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Hydraulics:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.hydraulicSystem}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px]">Electrical:</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedInspection.electricalSystem}</p>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase text-amber-700 font-bold">Action Recommended</span>
                <p className="text-slate-900 mt-1">{selectedInspection.actionRecommended}</p>
              </div>

              {selectedInspection.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Inspector Field Notes</span>
                  <p className="text-slate-700 mt-1">{selectedInspection.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Inspection Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-500" />
                  <span>Log Field Diagnostic Inspection</span>
                </h3>
                <p className="text-xs text-slate-500">Record physical assessment and telemetry parameters</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="mt-4 flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setInspectionType('Tyre')}
                className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                  inspectionType === 'Tyre'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" />
                <span>OTR Tyre Inspection</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectionType('Equipment')}
                className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 ${
                  inspectionType === 'Equipment'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Heavy Fleet Unit Inspection</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {inspectionType === 'Tyre' ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-mono mb-1">Target OTR Tyre *</label>
                    <select
                      required
                      value={formData.tyreId}
                      onChange={(e) => setFormData({ ...formData, tyreId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">-- Choose Tyre --</option>
                      {tyres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.tyreId} - {t.brand} {t.model} ({t.position || 'Spare'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Tread (mm)</label>
                      <input
                        type="number"
                        required
                        value={formData.treadDepth}
                        onChange={(e) => setFormData({ ...formData, treadDepth: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Pressure (PSI)</label>
                      <input
                        type="number"
                        required
                        value={formData.pressure}
                        onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Temp (°C)</label>
                      <input
                        type="number"
                        required
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Wear Pattern</label>
                      <select
                        value={formData.wearCondition}
                        onChange={(e) => setFormData({ ...formData, wearCondition: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Even Wear">Even Wear</option>
                        <option value="Shoulder Wear">Shoulder Wear</option>
                        <option value="Center Wear">Center Wear</option>
                        <option value="Irregular Cupping">Irregular Cupping</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Visible Damage</label>
                      <select
                        value={formData.visibleDamage}
                        onChange={(e) => setFormData({ ...formData, visibleDamage: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="None">None</option>
                        <option value="Sidewall Cut">Sidewall Cut</option>
                        <option value="Tread Chunking">Tread Chunking</option>
                        <option value="Bead Damage">Bead Damage</option>
                        <option value="Impact Bulge">Impact Bulge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-mono mb-1">Overall Condition</label>
                    <select
                      value={formData.tyreOverallCondition}
                      onChange={(e) => setFormData({ ...formData, tyreOverallCondition: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Good">Good (Nominal)</option>
                      <option value="Warning">Warning (Monitor)</option>
                      <option value="Critical">Critical (Immediate Action)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-mono mb-1">Target Equipment *</label>
                    <select
                      required
                      value={formData.equipmentId}
                      onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">-- Choose Equipment --</option>
                      {equipmentList.map((eq) => (
                        <option key={eq._id} value={eq._id}>
                          {eq.equipmentId} - {eq.name} ({eq.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Engine System</label>
                      <select
                        value={formData.engineCondition}
                        onChange={(e) => setFormData({ ...formData, engineCondition: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Good">Good</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Braking System</label>
                      <select
                        value={formData.brakeCondition}
                        onChange={(e) => setFormData({ ...formData, brakeCondition: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Good">Good</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Hydraulics</label>
                      <select
                        value={formData.hydraulicSystem}
                        onChange={(e) => setFormData({ ...formData, hydraulicSystem: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Good">Good</option>
                        <option value="Warning">Warning</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono mb-1">Cooling Circuit</label>
                      <select
                        value={formData.coolingSystem}
                        onChange={(e) => setFormData({ ...formData, coolingSystem: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Overheating">Overheating</option>
                        <option value="Leakage">Leakage</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-mono mb-1">Equipment Overall Health</label>
                    <select
                      value={formData.equipmentOverallCondition}
                      onChange={(e) => setFormData({ ...formData, equipmentOverallCondition: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Good">Good (Fit for Pit)</option>
                      <option value="Warning">Warning (Schedule Servicing)</option>
                      <option value="Critical">Critical (Ground Unit)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-mono mb-1">Action Recommended *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Routine operation permitted, or schedule rotation..."
                  value={formData.actionRecommended}
                  onChange={(e) => setFormData({ ...formData, actionRecommended: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition"
                >
                  {actionLoading ? 'Logging...' : 'Submit Diagnostic Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections;
