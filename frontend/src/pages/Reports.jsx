import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, TrendingUp, DollarSign, Activity, AlertTriangle, 
  Disc, CheckCircle2, Clock, Plus, RefreshCw, X, FileSpreadsheet, ShieldCheck,
  IndianRupee
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  LineChart, Line, Legend 
} from 'recharts';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Reports() {
  const { user, company, canScheduleMaintenance } = useAuth();
  const { addToast } = useToast();

  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    title: '',
    reportType: 'Fleet Health & Availability',
    period: 'Last 30 Days'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        reportAPI.getAll(),
        reportAPI.getAnalytics()
      ]);
      setReports(reportsRes.data.data || []);
      setAnalytics(analyticsRes.data.data || null);
    } catch (err) {
      addToast('Failed to load reports and analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await reportAPI.generate(generateForm);
      addToast('Executive Analytics Report generated and archived', 'success');
      setIsGenerateModalOpen(false);
      setGenerateForm({
        title: '',
        reportType: 'Fleet Health & Availability',
        period: 'Last 30 Days'
      });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = (report) => {
    const summary = report.summary || {};
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Report Title,"${report.title}"\n` +
      `Type,"${report.reportType}"\n` +
      `Period,"${report.period}"\n` +
      `Fleet Availability,"${summary.fleetAvailabilityPercent || 0}%"\n` +
      `Total Equipment,"${summary.totalEquipment || 0}"\n` +
      `Active Tyres,"${summary.activeTyresCount || 0}"\n` +
      `Avg Tread Wear,"${summary.avgTreadWearPercent || 0}%"\n` +
      `Maintenance Spend (INR),"₹${(summary.totalMaintenanceSpendUSD || 0).toLocaleString('en-IN')}"\n` +
      `MTBF (Hours),"${summary.meanTimeBetweenFailuresHours || 0} hrs"\n` +
      `MTTR (Hours),"${summary.meanTimeToRepairHours || 0} hrs"\n` +
      `Open Critical Alerts,"${summary.openCriticalAlerts || 0}"\n` +
      `Generated At,"${new Date(report.createdAt).toLocaleString()}"\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.title.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${report.title} to CSV`, 'info');
  };

  // Indian OTR Tyre Wear & Cost Per Hour in INR (₹)
  const wearTrendData = [
    { axle: 'Front Left', wearRateMM: 0.12, cpkINR: 1180 },
    { axle: 'Front Right', wearRateMM: 0.11, cpkINR: 1150 },
    { axle: 'Rear Left Out', wearRateMM: 0.18, cpkINR: 1540 },
    { axle: 'Rear Left In', wearRateMM: 0.15, cpkINR: 1350 },
    { axle: 'Rear Right Out', wearRateMM: 0.22, cpkINR: 1750 },
    { axle: 'Rear Right In', wearRateMM: 0.16, cpkINR: 1400 }
  ];

  const reliabilityData = [
    { month: 'Oct', availability: 92, mtbf: 460, spendLakhs: 31.5 },
    { month: 'Nov', availability: 94, mtbf: 490, spendLakhs: 35.0 },
    { month: 'Dec', availability: 89, mtbf: 410, spendLakhs: 48.0 },
    { month: 'Jan', availability: 95, mtbf: 520, spendLakhs: 26.0 },
    { month: 'Feb', availability: 93, mtbf: 480, spendLakhs: 29.5 },
    { month: 'Mar', availability: 96, mtbf: 540, spendLakhs: 23.5 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Reports & Analytics</h1>
              <p className="text-sm text-slate-500 font-medium">
                {company ? `${company.name} • ` : ''}MTBF / MTTR reliability indices, OTR tyre CPK (₹/hr), and DGMS audit exports.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canScheduleMaintenance && (
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Generate Audit Report
            </button>
          )}
        </div>
      </div>

      {/* KPI Reliability Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fleet Availability</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.fleetAvailability || 94}%
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +2.4% vs target SLA
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MTBF (Reliability)</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.mtbfHours || 480} <span className="text-sm font-semibold text-slate-500">Hours</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mean Time Between Failures
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MTTR (Repair Velocity)</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {analytics?.mttrHours || 4.2} <span className="text-sm font-semibold text-slate-500">Hours</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> -18% downtime speedup
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Maintenance Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ₹{((analytics?.totalMaintenanceSpend || 3930000) / 100000).toFixed(1)} <span className="text-sm font-semibold text-slate-500">Lakhs</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Period Total Budget Utilized (₹)
          </p>
        </div>
      </div>

      {/* Analytics Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OTR Tyre CPK & Wear Rate by Axle */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">OTR Tyre Wear & Cost-Per-Hour (₹/Hr)</h3>
              <p className="text-xs text-slate-500">Tread decay rate and hourly cost segmented by axle position</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
              Telemetry Telematics
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wearTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="axle" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" ₹" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }}
                  formatter={(val) => [`₹${val}/hr`, 'Cost Per Hour']}
                />
                <Legend />
                <Bar dataKey="cpkINR" name="Cost Per Hour (₹ INR)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Availability & MTBF Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Fleet Availability & MTBF 6-Month Trend</h3>
              <p className="text-xs text-slate-500">Continuous operational uptime vs MTBF threshold</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
              SLA High Availability
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reliabilityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="left" domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis yAxisId="right" orientation="right" domain={[300, 600]} tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="availability" name="Availability %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="mtbf" name="MTBF (Hrs)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Archived Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Archived Compliance & DGMS Audit Snapshots</h3>
            <p className="text-xs text-slate-500">Historical records generated for statutory DGMS mining compliance and board review</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
            {reports.length} Reports Archived
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Report Title</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Period</th>
                <th className="py-3 px-4 font-semibold">Fleet Availability</th>
                <th className="py-3 px-4 font-semibold">MTBF / MTTR</th>
                <th className="py-3 px-4 font-semibold">Maintenance Spend</th>
                <th className="py-3 px-4 font-semibold">Generated Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-slate-400">
                    No reports generated yet. Click "Generate Audit Report" above.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      {rep.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                        {rep.reportType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {rep.period}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {rep.summary?.fleetAvailabilityPercent || 94}%
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span className="text-blue-600 font-bold">{rep.summary?.meanTimeBetweenFailuresHours || 460}h MTBF</span> / {rep.summary?.meanTimeToRepairHours || 3.5}h MTTR
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{(rep.summary?.totalMaintenanceSpendUSD || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleExportCSV(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        title="Export to CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        CSV Export
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Generate Executive DGMS Audit Report</h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Kolar Pit Availability & OTR Tyre Audit"
                  value={generateForm.title}
                  onChange={(e) => setGenerateForm({ ...generateForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Report Type
                  </label>
                  <select
                    value={generateForm.reportType}
                    onChange={(e) => setGenerateForm({ ...generateForm, reportType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Fleet Health & Availability">Fleet Health & Availability</option>
                    <option value="OTR Tyre Lifecycle & CPK">OTR Tyre Lifecycle & CPK</option>
                    <option value="MTBF & Maintenance Cost">MTBF & Maintenance Cost</option>
                    <option value="Safety & Inspection Compliance">Safety & Inspection Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Time Period
                  </label>
                  <select
                    value={generateForm.period}
                    onChange={(e) => setGenerateForm({ ...generateForm, period: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Quarter-to-Date">Quarter-to-Date</option>
                    <option value="Year-to-Date">Year-to-Date</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 mb-1">Audit Snapshot Inclusions (INR ₹):</p>
                <p>• Fleet health index & active equipment status breakdown</p>
                <p>• OTR Tyre CPK (₹/hour) & DGMS tread safety threshold</p>
                <p>• MTBF / MTTR maintenance downtime calculations</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {generating ? 'Calculating...' : 'Generate & Archive Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
