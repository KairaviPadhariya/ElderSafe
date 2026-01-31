import {
    Users,
    Calendar,
    FileText,
    MessageSquare,
} from 'lucide-react';

function DoctorDashboard() {
    const stats = [
        { title: 'Total Patients', value: '142', icon: Users, color: 'bg-blue-500' },
        { title: 'Appointments Today', value: '8', icon: Calendar, color: 'bg-emerald-500' },
        { title: 'Pending Reports', value: '5', icon: FileText, color: 'bg-orange-500' },
        { title: 'Messages', value: '12', icon: MessageSquare, color: 'bg-violet-500' },
    ];

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                    Dr. Arun Kumar
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Good morning, here is your daily overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                </div>
                                <div className={`${stat.color} p-3 rounded-xl bg-opacity-10 dark:bg-opacity-20`}>
                                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Appointments</h3>
                    <button className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                    JP
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Janvi Patel</h4>
                                    <p className="text-slate-500 text-sm">Routine Checkup • 10:00 AM</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default DoctorDashboard;
