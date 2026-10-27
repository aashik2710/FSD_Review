import React, { useState, useEffect } from 'react';
import { 
  equipmentAPI, 
  siteAPI, 
  maintenanceAPI 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Truck, 
  Plus, 
  Search, 
  Eye, 
  Wrench, 
  Fuel, 
  X, 
  Calendar, 
  CircleDot, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  ClipboardList 
} from 'lucide-react';

const Equipment = () => {
  const { canManageFleet, canManageEquipment, canEditFleet, canDeleteRecords, canScheduleMaintenance, isTechnician, user } = useAuth();
  const toast = useToast();

  const [equipmentList, setEquipmentList] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  
  // Modals state
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [deleteConfirmEquipment, setDeleteConfirmEquipment] = useState(null);
  const [activeTab, setActiveTab] = useState('tyres'); // 'tyres', 'inspections', 'maintenance'

  // Form states
  const [newEquipment, setNewEquipment] = useState({
    equipmentId: '',
    name: '',
    type: 'Haul Truck',
    manufacturer: 'Caterpillar',
    model: '',
    serialNumber: '',
    siteId: '',
    operatingHours: 0,
    fuelLevelPercentage: 85,
    status: 'Active',
    notes: ''
  });

  const [editEquipmentData, setEditEquipmentData] = useState({
    name: '',
    type: 'Haul Truck',
    manufacturer: '',
    model: '',
    serialNumber: '',
    siteId: '',
    operatingHours: 0,
    fuelLevelPercentage: 85,
    status: 'Active',
    healthStatus: 'Good',
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: 'Preventive',
    description: '',
    priority: 'Medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    cost: 5000,
    notes: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (siteFilter) params.siteId = siteFilter;

      const [eqRes, siteRes] = await Promise.all([
        equipmentAPI.getAll(params),
        siteAPI.getAll()
      ]);
      setEquipmentList(eqRes.data.data || []);
      setSites(siteRes.data.data || []);
      if (siteRes.data.data?.length > 0 && !newEquipment.siteId) {
        setNewEquipment(prev => ({ ...prev, siteId: siteRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load equipment', err);
      toast.error(err.response?.data?.message || 'Failed to fetch equipment fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
    // Periodic background sync every 20 seconds to keep Active equipment operating hours updated
    const interval = setInterval(() => {
      equipmentAPI.getAll({
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        siteId: siteFilter || undefined
      }).then(res => {
        if (res.data?.data) {
          setEquipmentList(res.data.data);
        }
      }).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [typeFilter, statusFilter, siteFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEquipment();
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await equipmentAPI.create(newEquipment);
      toast.success(`Equipment unit ${newEquipment.equipmentId} registered!`);
      setIsAddModalOpen(false);
      setNewEquipment({
        equipmentId: '',
        name: '',
        type: 'Haul Truck',
        manufacturer: 'Caterpillar',
        model: '',
        serialNumber: '',
        siteId: sites[0]?._id || '',
        operatingHours: 0,
        fuelLevelPercentage: 85,
        status: 'Active',
        notes: ''
      });
      await fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (item) => {
    setSelectedEquipment(item);
    setEditEquipmentData({
      manufacturer: item.manufacturer,
      model: item.model,
      serialNumber: item.serialNumber || '',
      siteId: item.siteId?._id || item.siteId || sites[0]?._id || '',
      operatingHours: item.operatingHours || 0,
      fuelLevelPercentage: item.fuelLevelPercentage || 80,
      status: item.status || 'Active',
      healthStatus: item.healthStatus || 'Good',
      notes: item.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEquipment = async (e) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    try {
      setActionLoading(true);
      // Remove name and type from update payload
      const { name, type, ...payload } = editEquipmentData;
      await equipmentAPI.update(selectedEquipment._id, payload);
      toast.success(`Equipment unit ${selectedEquipment.equipmentId} updated.`);
      setIsEditModalOpen(false);
      setSelectedEquipment(null);
      await fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!deleteConfirmEquipment) return;
    try {
      setActionLoading(true);
      await equipmentAPI.delete(deleteConfirmEquipment._id);
      toast.success(`Equipment ${deleteConfirmEquipment.equipmentId} decommissioned.`);
      setDeleteConfirmEquipment(null);
      await fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete equipment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedEquipment) return;
    try {
      setActionLoading(true);
      await maintenanceAPI.create({
        ...maintenanceForm,
        equipmentId: selectedEquipment._id,
        maintenanceId: `WO-${Date.now().toString().slice(-5)}`
      });
      setIsMaintenanceModalOpen(false);
      toast.success(`Maintenance work order scheduled for ${selectedEquipment.equipmentId}`);
      await fetchEquipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  const openEquipmentDetails = async (id) => {
    try {
      const res = await equipmentAPI.getById(id);
      setSelectedEquipment(res.data.data);
      setActiveTab('tyres');
    } catch (err) {
      console.error('Failed to get equipment details', err);
      toast.error('Failed to load telemetry details');
    }
  };

  // KPIs
  const totalUnits = equipmentList.length;
  const activeUnits = equipmentList.filter(e => e.status === 'Active').length;
  const underMaintenance = equipmentList.filter(e => e.status === 'Under Maintenance' || e.status === 'Breakdown').length;
  const avgFuel = totalUnits > 0 ? Math.round(equipmentList.reduce((acc, e) => acc + (e.fuelLevelPercentage || 0), 0) / totalUnits) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <Truck className="w-6 h-6 text-amber-600" />
            <span>Heavy Equipment Fleet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time status, operating hours, installed tyre telemetry, and lifecycle servicing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEquipment}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 transition shadow-2xs"
            title="Refresh Fleet"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          {canManageFleet && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Fleet</p>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1.5">{totalUnits}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Active in Pit</p>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">{activeUnits}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Maintenance/Down</p>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600 mt-1.5">{underMaintenance}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Fuel Avg</p>
            <Fuel className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{avgFuel}%</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, equipment name, model, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
          >
            <option value="">All Equipment Types</option>
            <option value="Haul Truck">Haul Truck</option>
            <option value="Excavator">Excavator</option>
            <option value="Loader">Loader</option>
            <option value="Bulldozer">Bulldozer</option>
            <option value="Drilling Machine">Drilling Machine</option>
            <option value="Grader">Grader</option>
            <option value="Water Truck">Water Truck</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Breakdown">Breakdown</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
          >
            <option value="">All Sites</option>
            {sites.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Fleet Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs">
          No equipment units matched your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {equipmentList.map((item) => (
            <div
              key={item._id}
              className="industrial-card p-5 flex flex-col justify-between hover:border-slate-300 transition group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      {item.equipmentId}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-amber-800 transition">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.manufacturer} • {item.model}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-semibold">
                      <span>Operating Hours</span>
                      {item.status === 'Active' && (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold lowercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>live</span>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 font-bold mt-0.5">
                      {Number(item.operatingHours || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} hrs
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Health Rating</p>
                    <p className={`font-bold mt-0.5 ${item.healthStatus === 'Good' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.healthStatus}
                    </p>
                  </div>
                </div>

                {/* Fuel gauge preview */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-sky-600" /> Fuel Level
                    </span>
                    <span className="text-slate-900 font-bold">{item.fuelLevelPercentage || 80}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        (item.fuelLevelPercentage || 80) > 50 ? 'bg-sky-500' : (item.fuelLevelPercentage || 80) > 20 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.fuelLevelPercentage || 80}%` }}
                    />
                  </div>
                </div>

                {/* Installed Tyre Telemetry Preview */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span className="flex items-center gap-1 font-mono font-semibold">
                      <CircleDot className="w-3.5 h-3.5 text-amber-600" />
                      <span>Installed OTR Tyres</span>
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {item.mountedTyres?.length || 0} Installed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-medium">
                    Station: {item.siteId?.name || 'Pilbara Iron Pit'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => openEquipmentDetails(item._id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title="View details and installed tyres"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>View</span>
                </button>

                {canScheduleMaintenance && (
                  <button
                    onClick={() => {
                      setSelectedEquipment(item);
                      setIsMaintenanceModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                    title="Schedule maintenance work order"
                  >
                    <Wrench className="w-3.5 h-3.5 text-purple-600" />
                    <span>Service</span>
                  </button>
                )}

                {canEditFleet && (
                  <button
                    onClick={() => openEditModal(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                    title="Edit Equipment Details & Status"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit</span>
                  </button>
                )}

                {canDeleteRecords && (
                  <button
                    onClick={() => setDeleteConfirmEquipment(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                    title="Delete Equipment (Owner/Admin only)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Equipment Telemetry & Layout Detail Modal */}
      {selectedEquipment && !isMaintenanceModalOpen && !isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  {selectedEquipment.equipmentId}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedEquipment.name}</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedEquipment.manufacturer} • {selectedEquipment.model} ({selectedEquipment.type})</p>
              </div>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Spec Bar */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 uppercase text-[10px] font-semibold">
                  <span>Operating Hours</span>
                  {selectedEquipment.status === 'Active' && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold lowercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>live</span>
                    </span>
                  )}
                </div>
                <p className="text-slate-900 font-bold mt-1">
                  {Number(selectedEquipment.operatingHours || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} hrs
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] font-semibold">Fuel Level</span>
                <p className="text-amber-700 font-bold mt-1">{selectedEquipment.fuelLevelPercentage}%</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] font-semibold">Health Rating</span>
                <p className={selectedEquipment.healthStatus === 'Good' ? 'text-emerald-700 font-bold mt-1' : 'text-rose-700 font-bold mt-1'}>
                  {selectedEquipment.healthStatus}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 uppercase text-[10px] font-semibold">Operating Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedEquipment.status} />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('tyres')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'tyres' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" />
                <span>OTR Tyres Telemetry ({selectedEquipment.tyres?.length || selectedEquipment.mountedTyres?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('inspections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'inspections' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Recent Inspections ({selectedEquipment.recentInspections?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'maintenance' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Work Orders ({selectedEquipment.maintenanceHistory?.length || 0})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {activeTab === 'tyres' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedEquipment.tyres || selectedEquipment.mountedTyres || []).map((tyre) => (
                      <div
                        key={tyre._id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-amber-800">{tyre.tyreId}</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{tyre.position}</h4>
                            <p className="text-[11px] text-slate-500">{tyre.brand} {tyre.model} ({tyre.size})</p>
                          </div>
                          <StatusBadge status={tyre.condition} type="condition" />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                            <span className="text-slate-400 block font-semibold">Tread</span>
                            <span className="font-bold text-amber-700">{tyre.currentTreadDepth}mm</span>
                          </div>
                          <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                            <span className="text-slate-400 block font-semibold">Pressure</span>
                            <span className="font-bold text-sky-700">{tyre.currentPressure} PSI</span>
                          </div>
                          <div className="p-2 rounded bg-white border border-slate-200 shadow-2xs">
                            <span className="text-slate-400 block font-semibold">Temp</span>
                            <span className="font-bold text-rose-700">{tyre.currentTemperature}°C</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!selectedEquipment.tyres || selectedEquipment.tyres.length === 0) && 
                   (!selectedEquipment.mountedTyres || selectedEquipment.mountedTyres.length === 0) && (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono">
                      No tyres currently fitted. Go to the OTR Tyre Inventory to fit tyres to this unit.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspections' && (
                <div className="space-y-3">
                  {selectedEquipment.recentInspections && selectedEquipment.recentInspections.length > 0 ? (
                    selectedEquipment.recentInspections.map((insp) => (
                      <div key={insp._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-800 font-bold">
                            {new Date(insp.inspectionDate).toLocaleDateString()} by {insp.technicianId?.name || 'Field Inspector'}
                          </span>
                          <StatusBadge status={insp.equipmentOverallCondition || 'Good'} type="condition" />
                        </div>
                        <p className="text-slate-800 mt-2 font-mono text-xs">{insp.actionRecommended}</p>
                        {insp.notes && <p className="text-slate-500 mt-1 italic text-[11px]">{insp.notes}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono">
                      No inspection logs recorded yet for this equipment.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-3">
                  {selectedEquipment.maintenanceHistory && selectedEquipment.maintenanceHistory.length > 0 ? (
                    selectedEquipment.maintenanceHistory.map((maint) => (
                      <div key={maint._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-amber-800 font-bold">{maint.maintenanceId}</span>
                            <h4 className="font-bold text-slate-900 mt-0.5">{maint.maintenanceType} Service</h4>
                          </div>
                          <StatusBadge status={maint.status} />
                        </div>
                        <p className="text-slate-800 mt-2">{maint.description}</p>
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span>Scheduled: {new Date(maint.scheduledDate).toLocaleDateString()}</span>
                          <span className="text-amber-700 font-bold">${maint.cost?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono">
                      No work orders in history for this equipment.
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedEquipment.notes && (
              <div className="mt-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <p className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Service & Telemetry Notes</p>
                <p className="text-slate-700 mt-1">{selectedEquipment.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {isEditModalOpen && selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-600" />
                  <span>Update Equipment Unit</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    {selectedEquipment.equipmentId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{selectedEquipment.name}</span>
                  <span className="text-xs text-slate-500 font-medium">({selectedEquipment.type})</span>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEquipment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase text-amber-700 font-bold">Target Machinery</p>
                  <p className="font-bold text-slate-900">{selectedEquipment.name} <span className="font-normal text-slate-600 font-mono">({selectedEquipment.type})</span></p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-white text-slate-700 border border-amber-200 font-bold">
                  {selectedEquipment.manufacturer} {selectedEquipment.model}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Operating Hours</label>
                  <input
                    type="number"
                    value={editEquipmentData.operatingHours}
                    onChange={(e) => setEditEquipmentData({ ...editEquipmentData, operatingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fuel Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editEquipmentData.fuelLevelPercentage}
                    onChange={(e) => setEditEquipmentData({ ...editEquipmentData, fuelLevelPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Status</label>
                  <select
                    value={editEquipmentData.status}
                    onChange={(e) => setEditEquipmentData({ ...editEquipmentData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Breakdown">Breakdown</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Health Status</label>
                  <select
                    value={editEquipmentData.healthStatus}
                    onChange={(e) => setEditEquipmentData({ ...editEquipmentData, healthStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Good">Good</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assigned Mining Site</label>
                <select
                  value={editEquipmentData.siteId}
                  onChange={(e) => setEditEquipmentData({ ...editEquipmentData, siteId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  {sites.map(site => (
                    <option key={site._id} value={site._id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Operational Notes</label>
                <textarea
                  rows={3}
                  value={editEquipmentData.notes}
                  onChange={(e) => setEditEquipmentData({ ...editEquipmentData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Work Order Modal */}
      {isMaintenanceModalOpen && selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-600" />
                  <span>Schedule Maintenance Order</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedEquipment.equipmentId} - {selectedEquipment.name}</p>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleMaintenance} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Maintenance Type</label>
                <select
                  value={maintenanceForm.maintenanceType}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Preventive">Preventive Maintenance (PM)</option>
                  <option value="Corrective">Corrective Repair</option>
                  <option value="Emergency">Emergency Breakdown</option>
                  <option value="Inspection">Detailed Telemetry Inspection</option>
                  <option value="Tyre Replacement">Tyre Replacement & Rotation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Scheduled Service Date</label>
                  <input
                    type="date"
                    required
                    value={maintenanceForm.scheduledDate}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Priority Level</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Work Description</label>
                <textarea
                  required
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="E.g. 500-hour service cycle, hydraulic pressure test, tyre rotation..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Scheduling...' : 'Generate Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" />
                  <span>Register Mining Equipment</span>
                </h3>
                <p className="text-xs text-slate-500">Add a heavy haulage or auxiliary unit to the fleet</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Equipment ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="EQ-HT-105"
                    value={newEquipment.equipmentId}
                    onChange={(e) => setNewEquipment({ ...newEquipment, equipmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 uppercase font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit Nickname *</label>
                  <input
                    type="text"
                    required
                    placeholder="Titan Hauler 05"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Equipment Type</label>
                  <select
                    value={newEquipment.type}
                    onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Haul Truck">Haul Truck</option>
                    <option value="Excavator">Excavator</option>
                    <option value="Loader">Loader</option>
                    <option value="Bulldozer">Bulldozer</option>
                    <option value="Drilling Machine">Drilling Machine</option>
                    <option value="Grader">Grader</option>
                    <option value="Water Truck">Water Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Stationed Site</label>
                  <select
                    value={newEquipment.siteId}
                    onChange={(e) => setNewEquipment({ ...newEquipment, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    {sites.map((site) => (
                      <option key={site._id} value={site._id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    placeholder="Caterpillar / Komatsu"
                    value={newEquipment.manufacturer}
                    onChange={(e) => setNewEquipment({ ...newEquipment, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Model Code</label>
                  <input
                    type="text"
                    required
                    placeholder="797F / 930E"
                    value={newEquipment.model}
                    onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Decommission Equipment</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Are you sure you want to permanently decommission equipment unit <strong className="text-slate-900">{deleteConfirmEquipment.equipmentId}</strong> ({deleteConfirmEquipment.name})?
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmEquipment(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEquipment}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Decommission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
