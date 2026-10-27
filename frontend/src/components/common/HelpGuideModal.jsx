import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Truck, 
  CircleDot, 
  ClipboardCheck, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'equipment', label: 'Equipment', icon: Truck },
    { id: 'tyres', label: 'OTR Tyres', icon: CircleDot },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
    { id: 'maintenance', label: 'Work Orders', icon: Wrench },
    { id: 'alerts', label: 'Safety Alerts', icon: AlertTriangle }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden rounded-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>TerraSync User Guide & Cheat Sheet</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  Easy Mode
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Everything you need to navigate the mining telemetry console</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 overflow-x-auto p-2 gap-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs sm:text-sm bg-white">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h3 className="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  What is TerraSync?
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  TerraSync is an all-in-one heavy machinery and OTR tyre management console. It helps mining operations prevent catastrophic haul truck tyre blowouts, schedule preventive maintenance, and maintain 24/7 pit productivity.
                </p>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Quick Workflow Overview</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px]">1</span>
                    <span>Register Assets</span>
                  </div>
                  <p className="text-xs text-slate-600">Add Haul Trucks, Excavators, and OTR Tyres to your active mining pits.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-xs mb-1">
                    <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center text-[10px]">2</span>
                    <span>Log Daily Audits</span>
                  </div>
                  <p className="text-xs text-slate-600">Technicians log tread depth, tyre PSI, and machine diagnostics in seconds.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
                    <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px]">3</span>
                    <span>Resolve Safety Alerts</span>
                  </div>
                  <p className="text-xs text-slate-600">Telemetry engine automatically alerts you to overheating or low pressure.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">4</span>
                    <span>Execute Work Orders</span>
                  </div>
                  <p className="text-xs text-slate-600">Track workshop repairs, assign mechanics, and record replaced parts.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Managing Heavy Fleet Machinery</h3>
              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Viewing Fleet Status:</strong> Go to <strong>Equipment</strong> in the sidebar. You can filter by Status (<em>Active, Under Maintenance, Breakdown</em>) or Type (<em>Haul Truck, Excavator, Loader, Bulldozer</em>).
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Registering New Machinery:</strong> Click the amber <strong>+ Register Equipment</strong> button, select the mining site, enter model info, and submit.
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Machine Telemetry Modal:</strong> Click the eye icon on any machine row to see its mounted tyres, recent inspection cards, and maintenance history.
                  </div>
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'tyres' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">OTR Tyre Sensors & Axle Rotations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <p className="font-mono text-emerald-800 font-bold">Optimal PSI</p>
                  <p className="text-slate-900 font-black text-base mt-0.5">100 – 105 PSI</p>
                  <p className="text-[10px] text-slate-500">Standard operating range</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <p className="font-mono text-amber-800 font-bold">Max Temperature</p>
                  <p className="text-slate-900 font-black text-base mt-0.5">&lt; 85°C</p>
                  <p className="text-[10px] text-slate-500">Overheating risks failure</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <p className="font-mono text-rose-800 font-bold">Min Tread Depth</p>
                  <p className="text-slate-900 font-black text-base mt-0.5">&gt; 12 mm</p>
                  <p className="text-[10px] text-slate-500">Under 12mm requires replacement</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium">
                Click <strong>Axle Mounting & Rotation</strong> on the Tyres page to mount an inventory tyre onto a vehicle's axle (e.g. Front Left, Rear Right Outer) or rotate positions to equalize wear.
              </p>
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Conducting Field Diagnostics</h3>
              <p className="text-xs text-slate-700">
                You can log inspections for either an entire machine or a specific OTR tyre set.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ClipboardCheck className="w-4 h-4 text-amber-600" />
                  <span>How to Log an Inspection:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Click <strong>+ Log Inspection</strong> in the navigation or on the Inspections page.</li>
                  <li>Choose <strong>Equipment Inspection</strong> or <strong>Tyre Inspection</strong>.</li>
                  <li>Select the machine or tyre ID and rate subsystem health (Engine, Brakes, Hydraulics).</li>
                  <li>Submit to generate an instant Inspection Report Card.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Work Order Lifecycle</h3>
              <p className="text-xs text-slate-700">
                Work orders progress through 3 simple stages:
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold">1. Scheduled</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">2. In Progress</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">3. Completed</span>
              </div>
              <p className="text-xs text-slate-600">
                When completing a work order, you can log replaced spare parts (e.g. pumps, sensors, tyres) and their cost.
              </p>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Automated Anomaly Detection</h3>
              <p className="text-xs text-slate-700">
                The built-in telemetry scanner continuously watches for:
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span><strong>Low Tyre Pressure</strong>: Under 80 PSI</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span><strong>Thermal Overrun</strong>: Tyre or engine temperature exceeding 90°C</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span><strong>Severe Tread Wear</strong>: Tread depth 12mm or below</span>
                </li>
              </ul>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                Click <strong>"Resolve"</strong> on any alert once the physical check is complete.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">Tip: Use the Demo Role switcher to test different views</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs"
          >
            Got It, Let's Work!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpGuideModal;

