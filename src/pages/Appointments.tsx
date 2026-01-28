import { Calendar, Clock, MapPin, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Appointments() {
    const navigate = useNavigate();

    const appointments = [
        {
            id: 1,
            doctor: 'Dr. Sarvam Mehta',
            specialty: 'Cardiologist',
            date: 'Tomorrow, Jan 29',
            time: '10:00 AM',
            location: 'Heart Care Center, Suite 302',
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: 2,
            doctor: 'Dr. Janvi Patel',
            specialty: 'General Practitioner',
            date: 'Feb 15, 2024',
            time: '2:30 PM',
            location: 'City Medical Plaza',
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Appointments</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your visits and schedules</p>
                    </div>
                    <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">New Appointment</span>
                    </button>
                </div>

                <div className="grid gap-4">
                    {appointments.map((apt) => (
                        <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition-shadow">
                            <img
                                src={apt.image}
                                alt={apt.doctor}
                                className="w-20 h-20 rounded-2xl object-cover"
                            />
                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{apt.doctor}</h3>
                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full w-fit">
                                        {apt.status === 'upcoming' ? 'Upcoming' : 'Past'}
                                    </span>
                                </div>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-3">{apt.specialty}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {apt.date}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {apt.time}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {apt.location}
                                    </div>
                                </div>
                            </div>
                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <button className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    Reschedule
                                </button>
                                <button className="flex-1 px-4 py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Appointments;
