import {
  Activity,
  Stethoscope,
  FileText,
  Calendar,
  Pill,
  AlertCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import QuickStats from './QuickStats';
import SOSButton from './SOSButton';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Props {
  userName?: string; // make optional
}

function PatientDashboard({ userName }: Props) {
  const navigate = useNavigate();

  const [name, setName] = useState("User");

  useEffect(() => {
    // Priority: prop → localStorage → fallback
    if (userName) {
      setName(userName);
    } else {
      const storedName = localStorage.getItem("userName");
      if (storedName) setName(storedName);
    }
  }, [userName]);

  const featureCards = [
    {
      id: 'health-entry',
      title: 'Log Health Data',
      description: 'Record heart rate, blood pressure, and glucose levels',
      icon: Plus,
      color: 'bg-blue-500',
      stats: 'Last entry: 2 hours ago',
      path: '/daily-logs'
    },
    {
      id: 'health-tracker',
      title: 'Health Trends',
      description: 'View 7-day trends and patterns',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      stats: 'All vitals normal',
      path: '/health-trends'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Schedule and manage doctor visits',
      icon: Calendar,
      color: 'bg-violet-500',
      stats: 'Next: Tomorrow, 10:00 AM',
      path: '/appointments'
    },
    {
      id: 'doctors',
      title: 'My Doctors',
      description: 'Contact your healthcare providers',
      icon: Stethoscope,
      color: 'bg-cyan-500',
      stats: '3 doctors',
      path: '/doctors'
    },
    {
      id: 'medications',
      title: 'Medications',
      description: 'Track your medicines and dosages',
      icon: Pill,
      color: 'bg-orange-500',
      stats: '5 active prescriptions',
      path: '/medications'
    },
    {
      id: 'medical-history',
      title: 'Medical History',
      description: 'Conditions, allergies, and past records',
      icon: FileText,
      color: 'bg-pink-500',
      stats: 'Last updated: 1 week ago',
      path: '/medical-history'
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-300">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Welcome back, {name}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Here's your health overview for today
        </p>
      </div>

      <QuickStats />

      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Next Appointment
        </h3>
        <p className="text-slate-700 dark:text-slate-300">
          Tomorrow, 10:00 AM with Dr. Arun Kumar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {featureCards.map((card) => {
          const Icon = card.icon;

          const gradientMap: { [key: string]: string } = {
            'bg-blue-500': 'from-blue-500 to-blue-600',
            'bg-emerald-500': 'from-emerald-500 to-emerald-600',
            'bg-violet-500': 'from-violet-500 to-violet-600',
            'bg-cyan-500': 'from-cyan-500 to-cyan-600',
            'bg-orange-500': 'from-orange-500 to-orange-600',
            'bg-pink-500': 'from-pink-500 to-pink-600',
          };

          const gradient = gradientMap[card.color] || 'from-slate-500 to-slate-600';

          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 p-8 transition-all duration-300 hover:-translate-y-1 text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20">
                <Icon className={`w-32 h-32 ${card.color.replace('bg-', 'text-')}`} />
              </div>

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`bg-gradient-to-br ${gradient} p-4 rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                  {card.description}
                </p>

                <div className="flex items-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                  <Activity className="w-4 h-4 mr-2" />
                  {card.stats}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border">
        <div className="flex items-start gap-6">
          <div className="bg-amber-100 p-3 rounded-full">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">
              Health Reminders
            </h3>
            <p className="text-amber-800">
              Don't forget your medication at <b>6:00 PM</b>.
            </p>
          </div>
        </div>
      </div>

      <SOSButton />
    </main>
  );
}

export default PatientDashboard;