import React, { useState, useEffect } from 'react';
import { tyreAPI, equipmentAPI, siteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  CircleDot, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Thermometer, 
  Gauge, 
  Ruler, 
  ArrowRightLeft,
  X,
  Truck,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Flame,
  Activity,
  Archive,
  Layers,
  History
} from 'lucide-react';

const Tyres = () => {
  const { canManageFleet, canManageEquipment, canManageTyres, canEditFleet, canDeleteRecords, isTechnician } = useAuth();
  const toast = useToast();

  const [tyres, setTyres] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Modals
  const [selectedTyre, setSelectedTyre] = useState(null);
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmTyre, setDeleteConfirmTyre] = useState(null);

  // Forms
  const [fitForm, setFitForm] = useState({
    equipmentId: '',
    position: 'Front Left',
    reason: 'Standard Wear Rotation'
  });

  const [newTyre, setNewTyre] = useState({
    tyreId: '',
    brand: 'Michelin',
    model: 'XDR 3',
    size: '59/80R63',
    initialTreadDepth: 98,
    currentTreadDepth: 98,
    standardPressure: 102,
    currentPressure: 102,
    currentTemperature: 65,
    cost: 45000,
    status: 'Spare / Inventory',
    notes: ''
  });

  const [editFormData, setEditFormData] = useState({
    brand: '',
    model: '',
    size: '',
    currentTreadDepth: 0,
    currentPressure: 0,
    currentTemperature: 0,
    condition: 'Good',
    status: 'In Service',
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchTyres = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (conditionFilter) params.condition = conditionFilter;
      if (statusFilter) params.status = statusFilter;
      if (brandFilter) params.brand = brandFilter;

      const [tyreRes, eqRes, siteRes] = await Promise.all([
        tyreAPI.getAll(params),
        equipmentAPI.getAll(),
        siteAPI.getAll()
      ]);
      setTyres(tyreRes.data.data || []);
      setEquipmentList(eqRes.data.data || []);
      setSites(siteRes.data.data || []);
    } catch (err) {
      console.error('Failed to load tyres', err);
      toast.error(err.response?.data?.message || 'Failed to load OTR tyres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTyres();
  }, [conditionFilter, statusFilter, brandFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTyres();
  };

  const handleCreateTyre = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await tyreAPI.create(newTyre);
      toast.success(`OTR Tyre ${newTyre.tyreId} registered into inventory!`);
      setIsAddModalOpen(false);
      setNewTyre({
        tyreId: '',
        brand: 'Michelin',
        model: 'XDR 3',
        size: '59/80R63',
        initialTreadDepth: 98,
        currentTreadDepth: 98,
        standardPressure: 102,
        currentPressure: 102,
        currentTemperature: 65,
        cost: 45000,
        status: 'Spare / Inventory',
        notes: ''
      });
      await fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register tyre');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (tyre) => {
    setSelectedTyre(tyre);
    setEditFormData({
      brand: tyre.brand,
      model: tyre.model,
      size: tyre.size,
      currentTreadDepth: tyre.currentTreadDepth,
      currentPressure: tyre.currentPressure,
      currentTemperature: tyre.currentTemperature,
      condition: tyre.condition || 'Good',
      status: tyre.status || 'In Service',
      notes: tyre.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTyre = async (e) => {
    e.preventDefault();
    if (!selectedTyre) return;
    try {
      setActionLoading(true);
      // Remove brand and type/model from update payload
      const { brand, model, size, tyreId, ...payload } = editFormData;
      await tyreAPI.update(selectedTyre._id, payload);
      toast.success(`OTR Tyre ${selectedTyre.tyreId} telemetry updated.`);
      setIsEditModalOpen(false);
      setSelectedTyre(null);
      await fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tyre');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFitTyre = async (e) => {
    e.preventDefault();
    if (!selectedTyre) return;
    try {
      setActionLoading(true);
      const res = await tyreAPI.mount(selectedTyre._id, fitForm);
      toast.success(res.data.message || 'Tyre fitted/installed on vehicle successfully!');
      setIsFitModalOpen(false);
      setSelectedTyre(null);
      await fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fit tyre');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTyre = async () => {
    if (!deleteConfirmTyre) return;
    try {
      setActionLoading(true);
      await tyreAPI.delete(deleteConfirmTyre._id);
      toast.success(`Tyre ${deleteConfirmTyre.tyreId} decommissioned.`);
      setDeleteConfirmTyre(null);
      await fetchTyres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tyre');
    } finally {
      setActionLoading(false);
    }
  };

  // KPIs
  const totalTyres = tyres.length;
  const inServiceCount = tyres.filter(t => t.status === 'In Service').length;
  const spareCount = tyres.filter(t => t.status === 'Spare / Inventory').length;
  const criticalConditionCount = tyres.filter(t => t.condition === 'Critical' || t.condition === 'Warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <CircleDot className="w-6 h-6 text-amber-500" />
            <span>OTR Tyre Telemetry & Inventory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pressure, heat sensors, tread wear progression, and axle position management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTyres}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Tyres"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {canManageFleet && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register OTR Tyre</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Total OTR Assets</p>
            <CircleDot className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1.5">{totalTyres}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">In Active Service</p>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">{inServiceCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Depot Spares</p>
            <Archive className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{spareCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Heat/Wear Alert</p>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600 mt-1.5">{criticalConditionCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Tyre ID (e.g. TYR-MICH-01), size, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Health Conditions</option>
            <option value="Good">Good Condition</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical Alert</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="In Service">In Service</option>
            <option value="Spare / Inventory">Spare / Inventory</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Scrapped">Scrapped</option>
          </select>

          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Brands</option>
            <option value="Michelin">Michelin</option>
            <option value="Bridgestone">Bridgestone</option>
            <option value="Goodyear">Goodyear</option>
            <option value="Titan">Titan</option>
          </select>
        </div>
      </div>

      {/* Tyre Inventory Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : tyres.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs">
          No OTR tyres matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tyres.map((item) => {
            const treadPercent = Math.round((item.currentTreadDepth / (item.initialTreadDepth || 100)) * 100);
            const pressureDelta = Math.abs(item.currentPressure - (item.standardPressure || 102));

            return (
              <div
                key={item._id}
                onClick={() => setSelectedTyre(item)}
                className="industrial-card p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition group cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        {item.tyreId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-amber-600 transition">
                        {item.brand} {item.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{item.size}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={item.condition} type="condition" />
                      <span className="text-[10px] font-mono text-slate-500">{item.status}</span>
                    </div>
                  </div>

                  {/* Installation / Vehicle Station Badge */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-1.5 font-mono">
                      <Truck className="w-3.5 h-3.5 text-amber-500" />
                      <span className="truncate max-w-[140px]">{item.equipmentId ? item.equipmentId.name : 'In Depot (Spare Inventory)'}</span>
                    </span>
                    <span className="font-mono text-amber-600 font-bold text-[11px]">
                      {item.position || 'Unassigned'}
                    </span>
                  </div>

                  {/* Tread Depth Meter */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tread Remaining</span>
                      </span>
                      <span className="text-slate-800 font-bold">
                        {item.currentTreadDepth}mm / {item.initialTreadDepth}mm ({treadPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          treadPercent > 40
                            ? 'bg-emerald-500'
                            : treadPercent > 20
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, treadPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Sensor Telemetry Pill Boxes */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-sky-600" />
                          <span>PRESSURE</span>
                        </span>
                        <span className="text-slate-400">Std: {item.standardPressure || 102}</span>
                      </div>
                      <p className={`text-sm font-bold mt-1 ${pressureDelta > 15 ? 'text-rose-600 font-black' : 'text-sky-700'}`}>
                        {item.currentPressure} PSI
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-rose-500" />
                          <span>TEMPERATURE</span>
                        </span>
                        <span className="text-slate-400">&lt; 85°C</span>
                      </div>
                      <p className={`text-sm font-bold mt-1 ${item.currentTemperature > 85 ? 'text-rose-600 font-black' : 'text-emerald-700'}`}>
                        {item.currentTemperature}°C
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTyre(item);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="View Tyre Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTyre(item);
                      setFitForm({
                        equipmentId: item.equipmentId?._id || '',
                        position: item.position || 'Front Left',
                        reason: 'Axle Rotation & Wear Maintenance'
                      });
                      setIsFitModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Fit tyre to vehicle or rotate wheel position"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Fit to Vehicle</span>
                  </button>

                  {canEditFleet && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Edit Tyre Details & Condition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                  )}

                  {canDeleteRecords && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmTyre(item);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Delete Tyre (Owner/Admin only)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tyre Details & Replacement History Modal */}
      {selectedTyre && !isFitModalOpen && !isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                  {selectedTyre.tyreId}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedTyre.brand} {selectedTyre.model}</h2>
                <p className="text-xs text-slate-500 font-mono">Size: {selectedTyre.size} • Capital Cost: ₹{(selectedTyre.cost || 0).toLocaleString('en-IN')}</p>
              </div>
              <button
                onClick={() => setSelectedTyre(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs font-mono">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Tread Depth</span>
                  <p className="text-amber-600 font-bold text-sm mt-1">{selectedTyre.currentTreadDepth} mm</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Pressure</span>
                  <p className="text-sky-700 font-bold text-sm mt-1">{selectedTyre.currentPressure} PSI</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Temperature</span>
                  <p className="text-rose-600 font-bold text-sm mt-1">{selectedTyre.currentTemperature} °C</p>
                </div>
              </div>

              {/* Current Stationed Status */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Installed Location</span>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {selectedTyre.equipmentId ? `${selectedTyre.equipmentId.name || 'Equipment'} [${selectedTyre.position || 'Mounted'}]` : 'Spare Inventory (Depot)'}
                  </p>
                </div>
                <StatusBadge status={selectedTyre.condition} type="condition" />
              </div>

              {/* Installation History Log */}
              <div>
                <h4 className="text-xs uppercase text-amber-700 font-bold mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  <span>Installation & Rotation Timeline</span>
                </h4>
                {selectedTyre.replacementHistory && selectedTyre.replacementHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTyre.replacementHistory.map((hist, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-900 font-bold">{hist.equipmentName || 'Equipment Unit'} - {hist.position || 'Unassigned'}</p>
                          <span className="text-slate-500 text-[10px]">{hist.hoursUsed || 0} hrs used</span>
                        </div>
                        <p className="text-slate-600 mt-1">Reason: {hist.reason || 'Rotation'}</p>
                        <p className="text-slate-400 text-[10px] mt-1">
                          Installed: {hist.installedDate ? new Date(hist.installedDate).toLocaleDateString() : 'N/A'} {hist.removedDate ? `• Removed: ${new Date(hist.removedDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4 bg-slate-50 border border-slate-200 rounded-lg">
                    No historical rotation logs found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tyre Modal */}
      {isEditModalOpen && selectedTyre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  <span>Update Tyre Telemetry</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    {selectedTyre.tyreId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{selectedTyre.brand} {selectedTyre.model}</span>
                  <span className="text-xs text-slate-500 font-mono">({selectedTyre.size})</span>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTyre} className="mt-4 space-y-4 text-xs">
              {/* Brand and Type/Model Locked Banner */}
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase text-amber-700 font-bold">OTR Specification</p>
                  <p className="font-bold text-slate-900">{selectedTyre.brand} {selectedTyre.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-amber-200 font-bold block">
                    Size: {selectedTyre.size}
                  </span>
                  <span className="text-[9px] text-amber-800 font-mono font-semibold mt-0.5 block">Brand & Model Fixed</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Tread (mm)</label>
                  <input
                    type="number"
                    value={editFormData.currentTreadDepth}
                    onChange={(e) => setEditFormData({ ...editFormData, currentTreadDepth: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Pressure (PSI)</label>
                  <input
                    type="number"
                    value={editFormData.currentPressure}
                    onChange={(e) => setEditFormData({ ...editFormData, currentPressure: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    value={editFormData.currentTemperature}
                    onChange={(e) => setEditFormData({ ...editFormData, currentTemperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Condition Rating</label>
                  <select
                    value={editFormData.condition}
                    onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Good">Good</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-mono mb-1">Inventory Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="In Service">In Service</option>
                    <option value="Spare / Inventory">Spare / Inventory</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Scrapped">Scrapped</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Service & Inspection Notes</label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fit / Install Tyre on Vehicle Modal */}
      {isFitModalOpen && selectedTyre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-500" />
                  <span>Fit / Install Tyre to Vehicle</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedTyre.tyreId} ({selectedTyre.size})</p>
              </div>
              <button
                onClick={() => setIsFitModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFitTyre} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono mb-1">Target Vehicle / Equipment</label>
                <select
                  value={fitForm.equipmentId}
                  onChange={(e) => setFitForm({ ...fitForm, equipmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Remove from Vehicle (Return to Depot Spare) --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq._id} value={eq._id}>
                      {eq.equipmentId} - {eq.name} ({eq.type})
                    </option>
                  ))}
                </select>
              </div>

              {fitForm.equipmentId && (
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Wheel / Axle Position</label>
                  <select
                    value={fitForm.position}
                    onChange={(e) => setFitForm({ ...fitForm, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Front Left">Front Left (Pos 1)</option>
                    <option value="Front Right">Front Right (Pos 2)</option>
                    <option value="Rear Left">Rear Left</option>
                    <option value="Rear Right">Rear Right</option>
                    <option value="Rear Left Outer">Rear Left Outer (Pos 3)</option>
                    <option value="Rear Left Inner">Rear Left Inner (Pos 4)</option>
                    <option value="Rear Right Inner">Rear Right Inner (Pos 5)</option>
                    <option value="Rear Right Outer">Rear Right Outer (Pos 6)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-mono mb-1">Installation / Rotation Reason</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Front axle rotation due to shoulder wear..."
                  value={fitForm.reason}
                  onChange={(e) => setFitForm({ ...fitForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFitModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating Configuration...' : 'Fit Tyre to Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Tyre Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  <span>Register OTR Tyre</span>
                </h3>
                <p className="text-xs text-slate-500">Add new heavy mining tyre to telemetry inventory</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTyre} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Tyre Serial ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="TYR-MICH-10"
                    value={newTyre.tyreId}
                    onChange={(e) => setNewTyre({ ...newTyre, tyreId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 uppercase font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bridgestone / Michelin"
                    value={newTyre.brand}
                    onChange={(e) => setNewTyre({ ...newTyre, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Model / Pattern</label>
                  <input
                    type="text"
                    required
                    placeholder="VRPS / XDR 3"
                    value={newTyre.model}
                    onChange={(e) => setNewTyre({ ...newTyre, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Size Specification</label>
                  <input
                    type="text"
                    required
                    placeholder="59/80R63"
                    value={newTyre.size}
                    onChange={(e) => setNewTyre({ ...newTyre, size: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">New Tread (mm)</label>
                  <input
                    type="number"
                    required
                    value={newTyre.initialTreadDepth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewTyre({ ...newTyre, initialTreadDepth: val, currentTreadDepth: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Std PSI</label>
                  <input
                    type="number"
                    required
                    value={newTyre.standardPressure}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewTyre({ ...newTyre, standardPressure: val, currentPressure: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={newTyre.cost}
                    onChange={(e) => setNewTyre({ ...newTyre, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Tyre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTyre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Decommission Tyre</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Are you sure you want to permanently scrap and decommission <strong className="text-slate-900">{deleteConfirmTyre.tyreId}</strong> ({deleteConfirmTyre.brand} {deleteConfirmTyre.model})?
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmTyre(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTyre}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                {actionLoading ? 'Scrapping...' : 'Confirm Scrap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tyres;
