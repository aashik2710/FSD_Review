import React, { useState, useEffect } from 'react';
import { 
  maintenanceAPI, 
  equipmentAPI, 
  userAPI 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  DollarSign, 
  X, 
  RefreshCw, 
  Truck, 
  Eye, 
  Trash2, 
  CheckCheck, 
  Package, 
  Activity 
} from 'lucide-react';

const Maintenance = () => {
  const { user, isSuperAdmin, isOwner, isManager, isTechnician, isAdmin, canApproveMaintenance, canScheduleMaintenance, canCreateMaintenance, canDeleteRecords } = useAuth();
  const toast = useToast();

  const [maintenanceList, setMaintenanceList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState(null);

  // Forms
  const [newOrder, setNewOrder] = useState({
    equipmentId: '',
    maintenanceType: 'Preventive',
    description: '',
    priority: 'Medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    assignedTechnicianId: '',
    cost: 4500,
    notes: ''
  });

  const [updateStatusData, setUpdateStatusData] = useState({
    status: 'In Progress',
    cost: 0,
    notes: '',
    partName: '',
    partNumber: '',
    partCost: 0
  });

  const [actionLoading, setActionLoading] = useState(false);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [maintRes, eqRes, usersRes] = await Promise.all([
        maintenanceAPI.getAll(params),
        equipmentAPI.getAll(),
        userAPI.getAll()
      ]);
      setMaintenanceList(maintRes.data.data || []);
      setEquipmentList(eqRes.data.data || []);
      setTechnicians((usersRes.data.data || []).filter(u => u.role === 'TECHNICIAN' || u.role === 'MAINTENANCE_MANAGER' || u.role === 'ADMIN'));
    } catch (err) {
      console.error('Failed to load maintenance records', err);
      toast.error(err.response?.data?.message || 'Failed to load maintenance work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [statusFilter, priorityFilter]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await maintenanceAPI.create(newOrder);
      toast.success('Maintenance work order generated successfully!');
      setIsAddModalOpen(false);
      setNewOrder({
        equipmentId: equipmentList[0]?._id || '',
        maintenanceType: 'Preventive',
        description: '',
        priority: 'Medium',
        scheduledDate: new Date().toISOString().split('T')[0],
        assignedTechnicianId: technicians[0]?._id || '',
        cost: 4500,
        notes: ''
      });
      await fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create work order');
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusUpdate = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateStatusData({
      status: ticket.status === 'Scheduled' || ticket.status === 'Assigned' ? 'In Progress' : 'Completed',
      cost: ticket.cost || 0,
      notes: '',
      partName: '',
      partNumber: '',
      partCost: 0
    });
    setIsStatusUpdateOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setActionLoading(true);
      const payload = {
        status: updateStatusData.status,
        cost: Number(updateStatusData.cost) || selectedTicket.cost,
        notes: updateStatusData.notes ? `${selectedTicket.notes ? selectedTicket.notes + ' | ' : ''}${updateStatusData.notes}` : selectedTicket.notes
      };

      if (updateStatusData.partName) {
        payload.partsReplaced = [
          ...(selectedTicket.partsReplaced || []),
          {
            partName: updateStatusData.partName,
            partNumber: updateStatusData.partNumber,
            quantity: 1,
            cost: Number(updateStatusData.partCost) || 0
          }
        ];
      }

      await maintenanceAPI.update(selectedTicket._id, payload);
      toast.success(`Work order ${selectedTicket.maintenanceId} updated to [${updateStatusData.status}]`);
      setIsStatusUpdateOpen(false);
      setSelectedTicket(null);
      await fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update work order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOrder = async (id, approvalStatus) => {
    try {
      setActionLoading(true);
      await maintenanceAPI.approve(id, { approvalStatus });
      toast.success(`Work order decision recorded: [${approvalStatus}]`);
      await fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update approval status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    try {
      setActionLoading(true);
      await maintenanceAPI.delete(deleteConfirmOrder._id);
      toast.success(`Work order ${deleteConfirmOrder.maintenanceId} removed.`);
      setDeleteConfirmOrder(null);
      await fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete work order');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  // Filtered list
  const filteredList = maintenanceList.filter((item) => {
    const s = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.maintenanceId?.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s) ||
      item.equipmentId?.name?.toLowerCase().includes(s) ||
      item.equipmentId?.equipmentId?.toLowerCase().includes(s) ||
      item.assignedTechnicianId?.name?.toLowerCase().includes(s);

    return matchesSearch;
  });

  const totalOrders = maintenanceList.length;
  const inProgressOrders = maintenanceList.filter(m => m.status === 'In Progress').length;
  const completedOrders = maintenanceList.filter(m => m.status === 'Completed').length;
  const totalCost = maintenanceList.reduce((acc, m) => acc + (m.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <Wrench className="w-6 h-6 text-amber-500" />
            <span>Maintenance Hub & Work Orders</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch, track, and complete overhaul tickets, preventative cycles, and tyre replacements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMaintenance}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Maintenance"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {canScheduleMaintenance && (
            <button
              onClick={() => {
                if (equipmentList.length > 0 && !newOrder.equipmentId) {
                  setNewOrder(prev => ({ ...prev, equipmentId: equipmentList[0]._id }));
                }
                if (technicians.length > 0 && !newOrder.assignedTechnicianId) {
                  setNewOrder(prev => ({ ...prev, assignedTechnicianId: technicians[0]._id }));
                }
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Work Order</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Total Work Orders</p>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1.5">{totalOrders}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">In Progress</p>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{inProgressOrders}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Completed Service</p>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">{completedOrders}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Total Spend (₹)</p>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600 mt-1.5">₹{(totalCost / 100000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search work orders by WO#, description, equipment, or technician..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs">
          No work orders match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <div
              key={item._id}
              className="industrial-card p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        {item.maintenanceId}
                      </span>
                      <StatusBadge status={item.priority} type="severity" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition">
                      {item.maintenanceType} Service
                    </h3>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {/* Target Equipment */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-800 font-bold font-mono">
                      {item.equipmentId ? `${item.equipmentId.equipmentId} (${item.equipmentId.name})` : 'General Depot'}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {item.equipmentId?.type || 'Machine'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 font-sans line-clamp-2">
                  {item.description}
                </p>

                {/* Details Footer Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(item.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.assignedTechnicianId?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>₹{item.cost?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.partsReplaced?.length || 0} Parts Replaced</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => openDetailModal(item)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Details</span>
                </button>

                {/* Company Owner Approval Decision */}
                {canApproveMaintenance && item.approvalStatus !== 'Approved' && (
                  <button
                    onClick={() => handleApproveOrder(item._id, 'Approved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    title="Approve this maintenance expenditure"
                  >
                    <span>✓ Approve</span>
                  </button>
                )}

                {item.status !== 'Completed' && (
                  <button
                    onClick={() => openStatusUpdate(item)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>
                )}

                {/* Deletion restricted strictly to Super Admin and Company Owner */}
                {canDeleteRecords && (
                  <button
                    onClick={() => setDeleteConfirmOrder(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                    title="Delete Maintenance Record (Admin/Owner only)"
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

      {/* Work Order Detail Modal */}
      {isDetailModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                    {selectedTicket.maintenanceId}
                  </span>
                  <StatusBadge status={selectedTicket.priority} type="severity" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selectedTicket.maintenanceType} Work Order</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Stationed Asset</span>
                  <p className="text-slate-900 font-bold mt-0.5">
                    {selectedTicket.equipmentId?.equipmentId} - {selectedTicket.equipmentId?.name}
                  </p>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase">Service Description</span>
                <p className="text-slate-700 mt-1 p-3 rounded-lg bg-slate-50 border border-slate-200 font-sans">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Assigned Technician</span>
                  <p className="text-slate-900 font-bold mt-1">{selectedTicket.assignedTechnicianId?.name || 'Unassigned'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 text-[10px]">Recorded Cost</span>
                  <p className="text-amber-600 font-bold text-sm mt-1">${selectedTicket.cost?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Replaced Parts List */}
              <div>
                <span className="text-slate-700 text-[10px] uppercase font-bold">Parts & Consumables Utilized</span>
                {selectedTicket.partsReplaced && selectedTicket.partsReplaced.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {selectedTicket.partsReplaced.map((part, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 font-bold">{part.partName}</p>
                          <p className="text-slate-500 text-[10px]">PN: {part.partNumber || 'N/A'}</p>
                        </div>
                        <span className="text-amber-700 font-bold">${part.cost || 0}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 mt-1 p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    No components logged as replaced yet.
                  </p>
                )}
              </div>

              {selectedTicket.notes && (
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Technician Execution Notes</span>
                  <p className="text-slate-700 mt-1 p-3 rounded-lg bg-slate-50 border border-slate-200 font-sans">
                    {selectedTicket.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Work Order Status Modal */}
      {isStatusUpdateOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" />
                  <span>Update Work Order Progress</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedTicket.maintenanceId}</p>
              </div>
              <button
                onClick={() => setIsStatusUpdateOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono mb-1">Update Status Level</label>
                <select
                  value={updateStatusData.status}
                  onChange={(e) => setUpdateStatusData({ ...updateStatusData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                >
                  <option value="In Progress">In Progress (Underway)</option>
                  <option value="Completed">Completed (Signed Off)</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Adjust Recorded Cost (₹)</label>
                <input
                  type="number"
                  value={updateStatusData.cost}
                  onChange={(e) => setUpdateStatusData({ ...updateStatusData, cost: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Optional Part Replaced Entry */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] uppercase text-amber-700 font-bold block">Log Component Replacement (Optional)</span>
                <div>
                  <input
                    type="text"
                    placeholder="Part Name (e.g. Hydraulic Cylinder Seal)"
                    value={updateStatusData.partName}
                    onChange={(e) => setUpdateStatusData({ ...updateStatusData, partName: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:border-amber-500 focus:outline-none mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Part # (e.g. HYD-998)"
                      value={updateStatusData.partNumber}
                      onChange={(e) => setUpdateStatusData({ ...updateStatusData, partNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Part Cost (₹)"
                      value={updateStatusData.partCost}
                      onChange={(e) => setUpdateStatusData({ ...updateStatusData, partCost: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Service & Diagnostic Notes</label>
                <textarea
                  rows={3}
                  placeholder="Details on repair performed, torquing parameters, signoff..."
                  value={updateStatusData.notes}
                  onChange={(e) => setUpdateStatusData({ ...updateStatusData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusUpdateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  <span>Create Maintenance Work Order</span>
                </h3>
                <p className="text-xs text-slate-500">Dispatch technical crew for scheduled overhaul or repair</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono mb-1">Target Equipment *</label>
                <select
                  required
                  value={newOrder.equipmentId}
                  onChange={(e) => setNewOrder({ ...newOrder, equipmentId: e.target.value })}
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
                  <label className="block text-slate-700 font-mono mb-1">Maintenance Type</label>
                  <select
                    value={newOrder.maintenanceType}
                    onChange={(e) => setNewOrder({ ...newOrder, maintenanceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Preventive">Preventive Maintenance</option>
                    <option value="Corrective">Corrective Repair</option>
                    <option value="Emergency">Emergency Breakdown</option>
                    <option value="Inspection">Detailed Inspection</option>
                    <option value="Tyre Replacement">Tyre Replacement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-mono mb-1">Priority</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={newOrder.scheduledDate}
                    onChange={(e) => setNewOrder({ ...newOrder, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-mono mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={newOrder.cost}
                    onChange={(e) => setNewOrder({ ...newOrder, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Assigned Lead Technician</label>
                <select
                  value={newOrder.assignedTechnicianId}
                  onChange={(e) => setNewOrder({ ...newOrder, assignedTechnicianId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Unassigned (General Queue) --</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Work Order Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Task instructions, component replacement, torque specs..."
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Issue Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Delete Work Order</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Are you sure you want to permanently delete work order <strong className="text-slate-900">{deleteConfirmOrder.maintenanceId}</strong>?
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOrder(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
