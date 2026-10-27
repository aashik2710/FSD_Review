import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, CheckCircle2, AlertTriangle, ShieldCheck, 
  MapPin, Phone, Mail, Truck, Disc, Users, ExternalLink, RefreshCw, X
} from 'lucide-react';
import { companyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Companies() {
  const { isSuperAdmin, setSelectedCompanyId } = useAuth();
  const { addToast } = useToast();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    industryType: 'Gold Mining',
    contactEmail: '',
    contactPhone: '',
    headquarters: 'Bengaluru, Karnataka, India',
    subscriptionTier: 'Enterprise',
    maxSites: 10,
    maxEquipment: 100
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await companyAPI.getAll();
      setCompanies(res.data.data || []);
    } catch (err) {
      addToast('Failed to load mining companies directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await companyAPI.create(formData);
      addToast(`Mining Company tenant '${formData.name}' provisioned successfully`, 'success');
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        code: '',
        industryType: 'Gold Mining',
        contactEmail: '',
        contactPhone: '',
        headquarters: 'Bengaluru, Karnataka, India',
        subscriptionTier: 'Enterprise',
        maxSites: 10,
        maxEquipment: 100
      });
      fetchCompanies();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to provision company', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setSubmitting(true);
    try {
      await companyAPI.update(selectedCompany._id, selectedCompany);
      addToast(`Company '${selectedCompany.name}' updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchCompanies();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update company', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectCompany = (comp) => {
    setSelectedCompanyId(comp._id);
    addToast(`Switched active tenant context to ${comp.name}`, 'info');
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.code.toLowerCase().includes(search.toLowerCase()) ||
                          c.headquarters?.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = industryFilter === 'All' || c.industryType === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  // Global platform aggregates
  const totalFleet = companies.reduce((acc, c) => acc + (c.stats?.equipmentCount || 0), 0);
  const totalTyres = companies.reduce((acc, c) => acc + (c.stats?.tyresCount || 0), 0);
  const totalAlerts = companies.reduce((acc, c) => acc + (c.stats?.activeAlertsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mining Enterprises & Tenants</h1>
              <p className="text-sm text-slate-500 font-medium">
                Indian mining corporation multi-tenant administration, fleet isolation quotas, and enterprise provisioning.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompanies}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Provision Mining Company
            </button>
          )}
        </div>
      </div>

      {/* Platform Aggregates Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Companies</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{companies.length}</p>
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">National Machinery Fleet</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalFleet} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
            <Truck className="w-3.5 h-3.5 text-amber-500" /> Monitored 24/7
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total OTR Tyres</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalTyres} <span className="text-xs font-normal text-slate-500">Tyres</span></p>
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
            <Disc className="w-3.5 h-3.5" /> Live PSI Telemetry
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Anomalies</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalAlerts}</p>
          <span className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Across Indian Sites
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company name, code, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['All', 'Gold Mining', 'Coal Mining', 'Iron Ore'].map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustryFilter(ind)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                industryFilter === ind
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((comp) => (
          <div
            key={comp._id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider mb-2">
                    {comp.code} • {comp.industryType}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{comp.name}</h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {comp.subscriptionTier}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{comp.headquarters || 'Bengaluru, Karnataka, India'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{comp.contactEmail}</span>
                </div>
                {comp.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{comp.contactPhone}</span>
                  </div>
                )}
              </div>

              {/* Company Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-500">Sites</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{comp.stats?.sitesCount || 0}</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Fleet</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{comp.stats?.equipmentCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-500">OTR Tyres</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{comp.stats?.tyresCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleInspectCompany(comp)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Inspect Tenant
              </button>

              <button
                onClick={() => {
                  setSelectedCompany(comp);
                  setIsEditModalOpen(true);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Provision Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Provision New Mining Company</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharat Gold Mines Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company Code * (Uppercase)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BGML"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Industry Type
                  </label>
                  <select
                    value={formData.industryType}
                    onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Gold Mining">Gold Mining</option>
                    <option value="Coal Mining">Coal Mining</option>
                    <option value="Iron Ore">Iron Ore</option>
                    <option value="Copper Mining">Copper Mining</option>
                    <option value="Lithium & Rare Earths">Lithium & Rare Earths</option>
                    <option value="Bauxite & Aluminum">Bauxite & Aluminum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subscription Tier
                  </label>
                  <select
                    value={formData.subscriptionTier}
                    onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="operations@bharatgold.in"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 80 2558 4100"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headquarters Location
                </label>
                <input
                  type="text"
                  placeholder="Bengaluru, Karnataka, India"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {isEditModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Company: {selectedCompany.name}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={selectedCompany.name}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={selectedCompany.contactEmail}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subscription Tier
                  </label>
                  <select
                    value={selectedCompany.subscriptionTier}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, subscriptionTier: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headquarters
                </label>
                <input
                  type="text"
                  value={selectedCompany.headquarters || ''}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, headquarters: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
