import { Calendar, Clock, MapPin, Plus, Edit2 } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useState } from 'react';

function Appointments() {
    const [appointments, setAppointments] = useState([
        {
            id: 1,
            doctor: 'Dr. Arun Kumar',
            specialty: 'Cardiologist',
            date: 'Tomorrow, Jan 29',
            time: '10:00 AM',
            location: 'Heart Care Center, Suite 302',
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: 2,
            doctor: 'Dr. Anjali Singh',
            specialty: 'General Practitioner',
            date: 'Feb 15, 2024',
            time: '2:30 PM',
            location: 'City Medical Plaza',
            status: 'upcoming',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300'
        }
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState<number | null>(null);
    const [newAppointment, setNewAppointment] = useState({
        doctor: '',
        specialty: '',
        date: '',
        time: '',
        location: ''
    });
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

    const handleAddAppointment = () => {
        if (newAppointment.doctor && newAppointment.date && newAppointment.time) {
            setAppointments([...appointments, {
                id: Date.now(),
                doctor: newAppointment.doctor,
                specialty: newAppointment.specialty,
                date: newAppointment.date,
                time: newAppointment.time,
                location: newAppointment.location,
                status: 'upcoming',
                image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
            }]);
            setNewAppointment({ doctor: '', specialty: '', date: '', time: '', location: '' });
            setIsAdding(false);
        }
    };

    const handleReschedule = (id: number) => {
        if (rescheduleData.date && rescheduleData.time) {
            setAppointments(appointments.map(apt =>
                apt.id === id ? { ...apt, date: rescheduleData.date, time: rescheduleData.time } : apt
            ));
            setIsRescheduling(null);
            setRescheduleData({ date: '', time: '' });
        }
    };

    const startReschedule = (appointment: any) => {
        setIsRescheduling(appointment.id);
        setRescheduleData({ date: appointment.date, time: appointment.time });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">My Appointments</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your visits and schedules</p>
                    </div>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">{isAdding ? 'Cancel' : 'New Appointment'}</span>
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Appointment</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Doctor Name"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.doctor}
                                onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Specialty"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.specialty}
                                onChange={(e) => setNewAppointment({ ...newAppointment, specialty: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Date (e.g., Tomorrow, Jan 29)"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.date}
                                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Time (e.g., 10:00 AM)"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Location"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
                                value={newAppointment.location}
                                onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleAddAppointment}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Add Appointment
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid gap-4">
                    {appointments.map((apt) => (
                        isRescheduling === apt.id ? (
                            <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Reschedule Appointment</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">New Date</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Feb 10"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={rescheduleData.date}
                                            onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">New Time</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 2:00 PM"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            value={rescheduleData.time}
                                            onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReschedule(apt.id)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setIsRescheduling(null)}
                                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
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
                                    <button
                                        onClick={() => startReschedule(apt)}
                                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Reschedule
                                    </button>
                                    <button className="flex-1 px-4 py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                <div className="mt-8 text-center">
                    {/* Back button moved to top */}
                </div>
            </div>
        </div>
    );
}

export default Appointments;
