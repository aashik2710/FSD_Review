import React, { useState, useEffect } from 'react';
import { siteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  MapPin, 
  Plus, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  X, 
  Edit2, 
  Trash2, 
  Search, 
  Truck, 
  AlertTriangle, 
  Activity,
  Globe,
  Compass
} from 'lucide-react';

const Sites = () => {
  const { isAdmin, isSuperAdmin, isOwner, canManageSites } = useAuth();
  const toast = useToast();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [deleteConfirmSite, setDeleteConfirmSite] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    mineType: 'Open-pit',
    status: 'Active',
    description: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    mineType: 'Open-pit',
    status: 'Active',
    description: ''
  });

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await siteAPI.getAll();
      setSites(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sites', err);
      toast.error(err.response?.data?.message || 'Failed to load mining sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await siteAPI.create(formData);
      toast.success(`Mining site "${formData.name}" registered successfully!`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        location: '',
        mineType: 'Open-pit',
        status: 'Active',
        description: ''
      });
      await fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create site');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (site) => {
    setSelectedSite(site);
    setEditFormData({
      name: site.name,
      location: site.location,
      mineType: site.mineType,
      status: site.status,
      description: site.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSite = async (e) => {
    e.preventDefault();
    if (!selectedSite) return;
    try {
      setActionLoading(true);
      await siteAPI.update(selectedSite._id, editFormData);
      toast.success(`Mining site "${editFormData.name}" updated successfully.`);
      setIsEditModalOpen(false);
      setSelectedSite(null);
      await fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update site');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!deleteConfirmSite) return;
    try {
      setActionLoading(true);
      await siteAPI.delete(deleteConfirmSite._id);
      toast.success(`Mining site "${deleteConfirmSite.name}" decommissioned.`);
      setDeleteConfirmSite(null);
      await fetchSites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decommission site');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered sites
  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(search.toLowerCase()) || 
      site.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || site.mineType === typeFilter;
    const matchesStatus = !statusFilter || site.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalSites = sites.length;
  const totalFleetDeployed = sites.reduce((acc, s) => acc + (s.equipmentCount || 0), 0);
  const openPitCount = sites.filter(s => s.mineType === 'Open-pit').length;
  const undergroundCount = sites.filter(s => s.mineType === 'Underground').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-mono">
            <MapPin className="w-6 h-6 text-amber-500" />
            <span>Mining Sites & Operational Hubs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active pits, underground operations, and regional haul telemetry circuits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSites}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Refresh Sites"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register Mining Site</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Total Hubs</p>
            <Globe className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1.5">{totalSites}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Open-Pit Hubs</p>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1.5">{openPitCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Underground Pits</p>
            <Layers className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black font-mono text-sky-600 mt-1.5">{undergroundCount}</p>
        </div>

        <div className="industrial-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Fleet Stationed</p>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black font-mono text-purple-600 mt-1.5">{totalFleetDeployed} Units</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="industrial-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search mining sites by name or territory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Mining Types</option>
            <option value="Open-pit">Open-pit</option>
            <option value="Underground">Underground</option>
            <option value="Strip Mine">Strip Mine</option>
            <option value="Mountaintop Removal">Mountaintop Removal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Mining Sites Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="industrial-card p-12 text-center text-slate-500 font-mono text-xs">
          No mining sites matched your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <div key={site._id} className="industrial-card p-5 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition group">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase">
                      {site.mineType}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition">
                      {site.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{site.location}</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    site.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {site.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[54px]">
                  {site.description || 'Continuous heavy mining extraction hub and logistics depot.'}
                </p>

                {/* Fleet and Breakdown Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-amber-500" /> Fleet:
                    </span>
                    <span className="font-bold text-slate-900">{site.equipmentCount || 0} Units</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> Down:
                    </span>
                    <span className={`font-bold ${(site.breakdownCount || 0) > 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                      {site.breakdownCount || 0} Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with telemetry badge and actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 text-xs font-mono text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Telemetry Live</span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(site)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition flex items-center gap-1 font-semibold"
                    >
                      <Edit2 className="w-3 h-3 text-amber-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmSite(site)}
                      className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-2xs transition"
                      title="Decommission Site"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <span>Register Mining Site</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">Establish new regional extraction circuit</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono mb-1">Site / Pit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kolar Gold Fields / Jharia Coalfield"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Geographic Region / Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanbad, Jharkhand, India / Kolar, Karnataka, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Mine Classification</label>
                  <select
                    value={formData.mineType}
                    onChange={(e) => setFormData({ ...formData, mineType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Open-pit">Open-pit</option>
                    <option value="Underground">Underground</option>
                    <option value="Strip Mine">Strip Mine</option>
                    <option value="Mountaintop Removal">Mountaintop Removal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-mono mb-1">Operating Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Operational Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key commodities, haul routes, annual tonnage..."
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
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? 'Registering...' : 'Register Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {isEditModalOpen && selectedSite && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  <span>Update Site Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">Modifying {selectedSite.name}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSite} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono mb-1">Site / Pit Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-mono mb-1">Mine Classification</label>
                  <select
                    value={editFormData.mineType}
                    onChange={(e) => setEditFormData({ ...editFormData, mineType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Open-pit">Open-pit</option>
                    <option value="Underground">Underground</option>
                    <option value="Strip Mine">Strip Mine</option>
                    <option value="Mountaintop Removal">Mountaintop Removal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-mono mb-1">Operating Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-mono mb-1">Operational Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
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
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSite && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Decommission Site</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Are you sure you want to permanently decommission <strong className="text-slate-900">{deleteConfirmSite.name}</strong>?
            </p>
            {deleteConfirmSite.equipmentCount > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                ⚠️ Warning: {deleteConfirmSite.equipmentCount} equipment units are currently stationed here. You must reassign or remove them first.
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmSite(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSite}
                disabled={actionLoading || deleteConfirmSite.equipmentCount > 0}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md shadow-rose-600/30 disabled:opacity-40"
              >
                {actionLoading ? 'Processing...' : 'Confirm Decommission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sites;
