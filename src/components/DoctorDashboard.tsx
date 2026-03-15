import {
  Users,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  userName: string;
}

function DoctorDashboard({ userName }: Props) {

  const todayString = new Date().toISOString().slice(0, 10);

  const [appointments, setAppointments] = useState([
    { id: 1, name: 'Janvi Patel', details: 'Routine Checkup', reason: 'Regular check-up', time: '10:00 AM', initials: 'JP', date: todayString },
    { id: 2, name: 'Robert Fox', details: 'Blood Pressure Check', reason: 'Hypertension follow-up', time: '11:30 AM', initials: 'RF', date: todayString },
    { id: 3, name: 'Esther Howard', details: 'Consultation', reason: 'Discuss lab results', time: '02:00 PM', initials: 'EH', date: todayString },
    { id: 4, name: 'Old Patient', details: 'Follow-up', reason: 'Prescription refill', time: '09:00 AM', initials: 'OP', date: '2000-01-01' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ name: '', details: '', reason: '', time: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  const stats = [
    { title: 'Total Patients', value: '23', icon: Users, color: 'bg-blue-500' },
    { title: 'Appointments Today', value: appointments.filter(app => app.date === todayString).length.toString(), icon: Calendar, color: 'bg-emerald-500' },
  ];

  const handleAddAppointment = () => {
    if (newAppointment.name && newAppointment.time) {

      const initials = newAppointment.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      setAppointments([
        ...appointments,
        { ...newAppointment, id: Date.now(), initials, date: todayString }
      ]);

      setNewAppointment({ name: '', details: '', reason: '', time: '' });
      setIsAdding(false);
    }
  };

  const handleReschedule = (id: number) => {
    setAppointments(
      appointments.map(app =>
        app.id === id ? { ...app, time: editTime } : app
      )
    );

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
          Welcome back, Dr. {userName}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Here is your daily overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </h3>
                </div>

                <div className={`${stat.color} p-3 rounded-xl bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appointments */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden">

        <div className="p-6 border-b">
          <div className="flex justify-between items-center">

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Appointments Today
            </h3>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-emerald-600 text-sm font-medium hover:underline"
            >
              {isAdding ? 'Cancel' : '+ Add Appointment'}
            </button>

          </div>
        </div>

        {isAdding && (
          <div className="p-6 border-b bg-slate-50 dark:bg-slate-800">

            <div className="flex gap-4 flex-wrap">

              <input
                type="text"
                placeholder="Patient Name"
                className="border rounded-lg p-2 flex-1"
                value={newAppointment.name}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, name: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Details"
                className="border rounded-lg p-2 flex-1"
                value={newAppointment.details}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, details: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="Time"
                className="border rounded-lg p-2 w-40"
                value={newAppointment.time}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, time: e.target.value })
                }
              />

              <button
                onClick={handleAddAppointment}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg"
              >
                Add
              </button>

            </div>
          </div>
        )}

        <div className="divide-y">

          {appointments
            .filter(app => app.date === todayString)
            .map((appointment) => (

              <div key={appointment.id} className="p-6 flex justify-between items-center">

                <div className="flex items-center gap-4">

                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
                    {appointment.initials}
                  </div>

                  <div>
                    <h4 className="font-semibold">{appointment.name}</h4>
                    <p className="text-sm text-slate-500">
                      {appointment.details} • {appointment.time}
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => startReschedule(appointment)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-sm"
                >
                  Reschedule
                </button>

              </div>

            ))}

        </div>

      </div>

    </main>
  );
}

export default DoctorDashboard;