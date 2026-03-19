import {
    Heart,
    Activity,
    Phone,
    MapPin,
    AlertCircle,
    Clock,
    Stethoscope,
    FileText,
    ChevronRight,
    TrendingUp,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Props {
  userName?: string;
}

function FamilyDashboard({ userName } : Props) {
    const navigate = useNavigate();
    const [name, setName] = useState("User");

    useEffect(() => {
        if (userName) {
            setName(userName);
        } else {
            const storedName = localStorage.getItem("userName");
            if (storedName) setName(storedName);
        }
    }, [userName]);

    // Mock data for the chart
    const bpData = [
        { day: 'Mon', sys: 120, dia: 80 },
        { day: 'Tue', sys: 122, dia: 82 },
        { day: 'Wed', sys: 118, dia: 79 },
        { day: 'Thu', sys: 121, dia: 81 },
        { day: 'Fri', sys: 124, dia: 83 },
        { day: 'Sat', sys: 119, dia: 78 },
        { day: 'Sun', sys: 120, dia: 80 },
    ];

    const maxVal = 140; // Chart scaling

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                   <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                    Welcome, {name}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Monitoring status for: <span className="font-semibold text-slate-900 dark:text-white">Savitri (Mother)</span></p>
                </div>
                <button
                    onClick={() => navigate('/daily-logs')}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                >
                    <FileText className="w-5 h-5" />
                    View Daily Entries
                </button>
            </div>

            {/* Notifications Section - SOS & Emergency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* SOS Notification (Demo: Inactive normally, but styled to show capability) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">SOS Status</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No emergency alerts triggered recently.</p>
                    </div>
                </div>

                {/* Emergency Card */}
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-100 dark:border-rose-900/30">
                    <h3 className="font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> Emergency
                    </h3>
                    <p className="text-rose-600/80 dark:text-rose-300/60 text-sm mb-4">
                        Tap to call emergency contacts immediately.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 py-2 px-3 rounded-xl text-sm font-semibold shadow-sm border border-rose-100 dark:border-rose-900 flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> 102
                        </button>
                        <button className="bg-rose-600 text-white py-2 px-3 rounded-xl text-sm font-semibold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> Rahul
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Main Status Card */}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/20 p-2 rounded-xl">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-medium text-emerald-50">Current Vitals Status</span>
                            </div>
                            <h3 className="text-4xl font-bold mb-2">Stable & Normal</h3>
                            <p className="text-emerald-100">Heart Rate: 72 bpm | O2 Level: 98%</p>
                        </div>
                        <Heart className="absolute -bottom-8 -right-8 w-64 h-64 text-white opacity-10" />
                    </div>

                    {/* Medical Report / Vitals Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Blood Pressure Trends (Last 7 Days)
                            </h3>
                            <span className="text-sm text-slate-500">Sys/Dia (mmHg)</span>
                        </div>

                        {/* Custom SVG Chart */}
                        <div className="h-64 w-full">
                            <div className="h-full w-full flex items-end justify-between gap-2 px-2">
                                {bpData.map((data, index) => (
                                    <div key={index} className="flex flex-col items-center gap-2 w-full group">
                                        <div className="relative w-full flex flex-col items-center h-full justify-end">
                                            {/* Systolic Bar */}
                                            <div
                                                className="w-3 sm:w-6 bg-emerald-500 rounded-t-sm group-hover:bg-emerald-600 transition-colors relative"
                                                style={{ height: `${(data.sys / maxVal) * 100}%` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {data.sys}/{data.dia}
                                                </div>
                                            </div>
                                            {/* Diastolic Bar (Overlay or Stack? Let's do a trick: Just one bar for Sys, maybe another for Dia?) 
                                                Actually, for BP usually a range bar is best. But simple bar for Systolic is easier for demo. 
                                                Let's stick to simple Systolic bar for checking trends. 
                                            */}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{data.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {[
                                { time: '10:00 AM', event: 'Took morning medication', icon: Clock },
                                { time: '09:30 AM', event: 'Blood pressure recorded: 120/80', icon: Activity },
                                { time: '08:00 AM', event: 'Woke up', icon: Activity },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                                        {i !== 2 && <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-2" />}
                                    </div>
                                    <div className="pb-6">
                                        <p className="text-slate-900 dark:text-white font-medium">{item.event}</p>
                                        <p className="text-slate-500 text-sm">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Doctor Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" /> Primary Doctor
                        </h3>
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            AK
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Dr. Arun Kumar</p>
                            <p className="text-slate-500 text-sm">Cardiologist</p>
                        </div>
                    </div>
                    <button className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        Call Doctor
                    </button>
                </div>

                {/* Location Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Location</h3>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-xl h-48 flex items-center justify-center text-slate-400 mb-4">
                        <MapPin className="w-8 h-8 mr-2" />
                        <span>Map Unavailable in Demo</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        Home - 15 mins ago
                    </p>
                </div>

            </div>
        </main>
    );
}

export default FamilyDashboard;
