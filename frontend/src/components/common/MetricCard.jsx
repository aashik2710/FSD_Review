import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'amber', trend }) => {
  const colorMap = {
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    sky: 'text-sky-700 bg-sky-50 border-sky-200',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200'
  };

  return (
    <div className="industrial-card p-5 relative overflow-hidden group hover:border-slate-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline mt-2 gap-2">
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 font-mono">{value}</h3>
            {subtitle && <span className="text-xs text-slate-500 font-medium">{subtitle}</span>}
          </div>
          {trend && (
            <p className="text-xs mt-2 text-slate-500 flex items-center gap-1 font-medium">
              <span className={trend.isPositive ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {trend.value}
              </span>
              <span>{trend.label}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.amber} transition-transform group-hover:scale-110 shadow-2xs`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-amber-500 transition-all duration-300" />
    </div>
  );
};

export default MetricCard;

