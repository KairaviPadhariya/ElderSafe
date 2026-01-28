import { Heart, Activity, Droplet, Stethoscope } from 'lucide-react';

function QuickStats() {
  const stats = [
    {
      label: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      icon: Heart,
      status: 'normal',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+2 from yesterday',
      gradient: 'from-emerald-400 to-emerald-600'
    },
    {
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      icon: Stethoscope,
      status: 'normal',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'Stable',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      label: 'Blood Glucose',
      value: '95',
      unit: 'mg/dL',
      icon: Droplet,
      status: 'normal',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      trend: '-5 from last week',
      gradient: 'from-cyan-400 to-cyan-600'
    },
    {
      label: 'Oxygen Level',
      value: '98',
      unit: '%',
      icon: Activity,
      status: 'normal',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      trend: 'Normal',
      gradient: 'from-violet-400 to-violet-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 p-6 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-md`}>
                <Icon className={`w-6 h-6 text-white`} />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                Normal
              </span>
            </div>

            <div className="mb-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-sm font-medium text-slate-400 ml-1.5">{stat.unit}</span>
              )}
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{stat.trend}</p>
          </div>
        );
      })}
    </div>
  );
}

export default QuickStats;
