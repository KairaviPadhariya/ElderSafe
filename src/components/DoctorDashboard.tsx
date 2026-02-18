import {
    Users,
    Calendar,
    FileText,
    MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

function DoctorDashboard() {
    const [appointments, setAppointments] = useState([
        { id: 1, name: 'Janvi Patel', details: 'Routine Checkup', time: '10:00 AM', initials: 'JP' },
        { id: 2, name: 'Robert Fox', details: 'Blood Pressure Check', time: '11:30 AM', initials: 'RF' },
        { id: 3, name: 'Esther Howard', details: 'Consultation', time: '02:00 PM', initials: 'EH' },
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newAppointment, setNewAppointment] = useState({ name: '', details: '', time: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTime, setEditTime] = useState('');

    const stats = [
        { title: 'Total Patients', value: '23', icon: Users, color: 'bg-blue-500' },
        { title: 'Appointments Today', value: '3', icon: Calendar, color: 'bg-emerald-500' },
        { title: 'Medical Records', value: '42', icon: FileText, color: 'bg-purple-500' },
        { title: 'Messages', value: '5', icon: MessageSquare, color: 'bg-orange-500' },
    ];

    const handleAddAppointment = () => {
        if (newAppointment.name && newAppointment.time) {
            const initials = newAppointment.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            setAppointments([...appointments, { ...newAppointment, id: Date.now(), initials }]);
            setNewAppointment({ name: '', details: '', time: '' });
            setIsAdding(false);
        }
    };

    const handleReschedule = (id: number) => {
        setAppointments(appointments.map(app =>
            app.id === id ? { ...app, time: editTime } : app
        ));
        setEditingId(null);
        setEditTime('');
    };

    const startReschedule = (appointment: any) => {
        setEditingId(appointment.id);
        setEditTime(appointment.time);
    };

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
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Appointments with Patients</h3>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline"
                    >
                        {isAdding ? 'Cancel' : '+ Add Appointment'}
                    </button>
                </div>

                {isAdding && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Patient Name"
                                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white p-2"
                                value={newAppointment.name}
                                onChange={(e) => setNewAppointment({ ...newAppointment, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Details (e.g., Routine Checkup)"
                                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white p-2"
                                value={newAppointment.details}
                                onChange={(e) => setNewAppointment({ ...newAppointment, details: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Time (e.g., 10:00 AM)"
                                className="w-full sm:w-40 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white p-2"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                            />
                            <button
                                onClick={handleAddAppointment}
                                className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {appointments.map((appointment) => (
                        <div key={appointment.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                    {appointment.initials}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{appointment.name}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{appointment.details} • {appointment.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingId === appointment.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="w-24 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white p-1 text-sm"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleReschedule(appointment.id)}
                                            className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startReschedule(appointment)}
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                                        >
                                            Reschedule
                                        </button>
                                        <button className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                                            View Details
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

export default DoctorDashboard;
