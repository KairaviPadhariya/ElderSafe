import { Calendar, Clock, MapPin, Plus, Edit2, Stethoscope } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import BackButton from '../components/BackButton';
import { logActivitySafely } from '../utils/logging';

const API_BASE_URL = 'http://34.233.187.127:8000';
const REQUEST_TIMEOUT_MS = 12000;
type Appointment = {
    _id?: string;
    id?: string | number;
    doctor_id?: string;
    doctor_name?: string;
    patient_id?: string;
    patient_name?: string;
    specialty?: string;
    date: string;
    time: string;
    reason?: string;
    location?: string;
    status?: string;
    image?: string;
};

type DoctorScheduleAppointment = {
    _id?: string;
    patient_id?: string;
    patient_name?: string;
    date?: string;
    time?: string;
};

type DoctorDashboardResponse = {
    schedule?: DoctorScheduleAppointment[];
};

type Doctor = {
    _id: string;
    name?: string;
    specialization?: string;
    hospital?: string;
};

type AppointmentFormState = {
    doctorId: string;
    doctor: string;
    specialty: string;
    date: string;
    time: string;
    location: string;
};

function getTodayDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function createEmptyFormState(): AppointmentFormState {
    return {
        doctorId: '',
        doctor: '',
        specialty: '',
        date: '',
        time: '',
        location: ''
    };
}

function getAppointmentDateTime(appointment: Appointment) {
    return new Date(`${appointment.date}T${appointment.time}`);
}

function isUpcomingAppointment(appointment: Appointment, now = new Date()) {
    if (appointment.status === 'cancelled') {
        return false;
    }

    const appointmentDate = getAppointmentDateTime(appointment);
    return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now;
}

async function requestJson(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            throw new Error(data?.detail || data?.message || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check that the backend and MongoDB are running.');
        }

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function Appointments() {
    const role = localStorage.getItem('userRole') || 'patient';
    const canCreateAppointments = role !== 'doctor';
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState<string | number | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | number | null>(null);
    const [newAppointment, setNewAppointment] = useState<AppointmentFormState>(createEmptyFormState());
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | number | null>(null);
    const [cancellingId, setCancellingId] = useState<string | number | null>(null);
    const [error, setError] = useState('');
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [patientNamesByAppointment, setPatientNamesByAppointment] = useState<Record<string, string>>({});

    const visibleAppointments = appointments.filter((appointment) => isUpcomingAppointment(appointment, currentTime));
    const minDate = getTodayDate();

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => window.clearInterval(intervalId);
    }, []);

    const loadAppointments = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to view appointments.');
            setLoading(false);
            return;
        }

        try {
            const data = await requestJson(`${API_BASE_URL}/appointments`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setAppointments(Array.isArray(data) ? data : []);
        } catch (loadError) {
            console.error('Failed to load appointments:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'Unable to load appointments from the server.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDoctors = useCallback(async () => {
        try {
            const data = await requestJson(`${API_BASE_URL}/doctors`);
            setDoctors(Array.isArray(data) ? data : []);
        } catch (loadError) {
            console.error('Failed to load doctors:', loadError);
            setDoctors([]);
        }
    }, []);

    const loadDoctorPatientNames = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setPatientNamesByAppointment({});
            return;
        }

        try {
            const data = await requestJson(`${API_BASE_URL}/doctors/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }) as DoctorDashboardResponse;

            const schedule = Array.isArray(data?.schedule) ? data.schedule : [];
            const nextMap = schedule.reduce<Record<string, string>>((map, appointment) => {
                const key = appointment._id ?? `${appointment.date}-${appointment.time}-${appointment.patient_id ?? ''}`;
                const name = appointment.patient_name || appointment.patient_id || '';

                if (key && name) {
                    map[key] = name;
                }

                return map;
            }, {});

            setPatientNamesByAppointment(nextMap);
        } catch (loadError) {
            console.error('Failed to load doctor patient names:', loadError);
            setPatientNamesByAppointment({});
        }
    }, []);

    useEffect(() => {
        loadAppointments();
        if (canCreateAppointments) {
            loadDoctors();
        } else {
            loadDoctorPatientNames();
        }
    }, [canCreateAppointments, loadAppointments, loadDoctorPatientNames, loadDoctors]);

    const getMinTime = (selectedDate: string) => {
        if (!selectedDate) {
            return undefined;
        }

        return selectedDate === minDate ? getCurrentTime() : undefined;
    };

    const handleAddAppointment = async () => {
        if (!newAppointment.doctor || !newAppointment.date || !newAppointment.time) {
            setError('Doctor, date, and time are required.');
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to add an appointment.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const savedAppointment = await requestJson(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctor_id: newAppointment.doctorId,
                    doctor_name: newAppointment.doctor,
                    specialty: newAppointment.specialty,
                    date: newAppointment.date,
                    time: newAppointment.time,
                    location: newAppointment.location,
                    reason: newAppointment.specialty || 'General appointment',
                    status: 'upcoming'
                })
            });

            await logActivitySafely({
                action: 'appointment_created',
                activity_type: 'appointment',
                description: `Appointment booked with ${newAppointment.doctor} for ${newAppointment.date} at ${newAppointment.time}.`,
                metadata: {
                    appointment_id: savedAppointment?._id || savedAppointment?.id || null,
                    doctor_id: newAppointment.doctorId,
                    doctor_name: newAppointment.doctor,
                    specialty: newAppointment.specialty,
                    date: newAppointment.date,
                    time: newAppointment.time,
                    location: newAppointment.location,
                    actor_role: role
                }
            });

            await loadAppointments();
            setNewAppointment(createEmptyFormState());
            setIsAdding(false);
        } catch (saveError) {
            console.error('Failed to save appointment:', saveError);
            setError(saveError instanceof Error ? saveError.message : 'Unable to save appointment to MongoDB.');
        } finally {
            setSaving(false);
        }
    };

    const handleReschedule = async (id: string | number) => {
        if (!rescheduleData.date || !rescheduleData.time) {
            setError('Date and time are required to update the appointment.');
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to update the appointment.');
            return;
        }

        setUpdatingId(id);
        setError('');

        try {
            const existingAppointment = appointments.find((appointment) => (appointment._id ?? appointment.id) === id);
            const data = await requestJson(`${API_BASE_URL}/appointments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: rescheduleData.date,
                    time: rescheduleData.time,
                    status: 'upcoming'
                })
            });

            await logActivitySafely({
                action: 'appointment_rescheduled',
                activity_type: 'appointment',
                description: `Appointment moved to ${rescheduleData.date} at ${rescheduleData.time}.`,
                metadata: {
                    appointment_id: id,
                    previous_date: existingAppointment?.date || null,
                    previous_time: existingAppointment?.time || null,
                    new_date: rescheduleData.date,
                    new_time: rescheduleData.time,
                    doctor_name: existingAppointment?.doctor_name || null,
                    patient_name: existingAppointment?.patient_name || null,
                    actor_role: role
                }
            });

            setAppointments((current) =>
                current.map((appointment) => ((appointment._id ?? appointment.id) === id ? data : appointment))
            );
            setIsRescheduling(null);
            setRescheduleData({ date: '', time: '' });
        } catch (updateError) {
            console.error('Failed to update appointment:', updateError);
            setError(updateError instanceof Error ? updateError.message : 'Unable to update appointment.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelAppointment = async (id: string | number) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to cancel the appointment.');
            return;
        }

        setCancellingId(id);
        setError('');

        try {
            const existingAppointment = appointments.find((appointment) => (appointment._id ?? appointment.id) === id);
            await requestJson(`${API_BASE_URL}/appointments/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await logActivitySafely({
                action: 'appointment_cancelled',
                activity_type: 'appointment',
                description: `Appointment cancelled for ${existingAppointment?.date || 'the scheduled date'} at ${existingAppointment?.time || 'the scheduled time'}.`,
                metadata: {
                    appointment_id: id,
                    doctor_name: existingAppointment?.doctor_name || null,
                    patient_name: existingAppointment?.patient_name || null,
                    date: existingAppointment?.date || null,
                    time: existingAppointment?.time || null,
                    location: existingAppointment?.location || null,
                    actor_role: role
                }
            });

            setAppointments((current) =>
                current.filter((appointment) => (appointment._id ?? appointment.id) !== id)
            );

            if (isRescheduling === id) {
                setIsRescheduling(null);
                setRescheduleData({ date: '', time: '' });
            }
        } catch (cancelError) {
            console.error('Failed to cancel appointment:', cancelError);
            setError(cancelError instanceof Error ? cancelError.message : 'Unable to cancel appointment.');
        } finally {
            setCancellingId(null);
            setAppointmentToDelete(null);
        }
    };

    const startReschedule = (appointment: Appointment) => {
        const appointmentId = appointment._id ?? appointment.id;
        setError('');
        setIsRescheduling(appointmentId ?? null);
        setRescheduleData({ date: appointment.date, time: appointment.time });
    };

    const handleDoctorChange = (doctorId: string) => {
        const selectedDoctor = doctors.find((doctor) => doctor._id === doctorId);

        setNewAppointment((current) => ({
            ...current,
            doctorId,
            doctor: selectedDoctor?.name || '',
            specialty: selectedDoctor?.specialization || '',
            location: selectedDoctor?.hospital || ''
        }));
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
                    {canCreateAppointments && (
                        <button
                            onClick={() => {
                                setError('');
                                setIsAdding(!isAdding);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">New Appointment</span>
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-6">
                        {error}
                    </div>
                )}

                {appointmentToDelete !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => {
                                if (!cancellingId) {
                                    setAppointmentToDelete(null);
                                }
                            }}
                        />
                        <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Delete appointment?
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                This will permanently remove the appointment from your records.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    disabled={cancellingId !== null}
                                    onClick={() => setAppointmentToDelete(null)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-70"
                                >
                                    Keep Appointment
                                </button>
                                <button
                                    type="button"
                                    disabled={cancellingId !== null}
                                    onClick={() => handleCancelAppointment(appointmentToDelete)}
                                    className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors disabled:opacity-70"
                                >
                                    {cancellingId !== null ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {canCreateAppointments && isAdding && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Appointment</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <select
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.doctorId}
                                onChange={(e) => handleDoctorChange(e.target.value)}
                            >
                                <option value="">Select Doctor</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor._id} value={doctor._id}>
                                        {doctor.name || 'Unnamed Doctor'}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Specialty"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.specialty}
                                readOnly
                            />
                            <input
                                type="date"
                                min={minDate}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.date}
                                onChange={(e) => setNewAppointment({
                                    ...newAppointment,
                                    date: e.target.value,
                                    time: newAppointment.date !== e.target.value ? '' : newAppointment.time
                                })}
                            />
                            <input
                                type="time"
                                min={getMinTime(newAppointment.date)}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Location"
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:col-span-2"
                                value={newAppointment.location}
                                readOnly
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleAddAppointment}
                                disabled={saving}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                {saving ? 'Saving...' : 'Add Appointment'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewAppointment(createEmptyFormState());
                                }}
                                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {!loading && visibleAppointments.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No appointments</h3>
                        <p className="text-slate-500 dark:text-slate-300">There are no upcoming appointments right now.</p>
                    </div>
                ) : !loading ? (
                    <div className="grid gap-4">
                        {visibleAppointments.map((apt) => {
                            const appointmentId = apt._id ?? apt.id ?? `${apt.doctor_name}-${apt.date}-${apt.time}`;
                            const appointmentName = canCreateAppointments
                                ? (apt.doctor_name || apt.doctor_id || 'Doctor')
                                : (apt.patient_name || patientNamesByAppointment[String(appointmentId)] || apt.patient_id || 'Patient');
                            const specialty = apt.specialty || apt.reason || 'General appointment';
                            const location = apt.location || 'Location not provided';

                            return isRescheduling === appointmentId ? (
                                <div key={appointmentId} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Update Appointment</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">New Date</label>
                                            <input
                                                type="date"
                                                min={minDate}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={rescheduleData.date}
                                                onChange={(e) => setRescheduleData({
                                                    ...rescheduleData,
                                                    date: e.target.value,
                                                    time: rescheduleData.date !== e.target.value ? '' : rescheduleData.time
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">New Time</label>
                                            <input
                                                type="time"
                                                min={getMinTime(rescheduleData.date)}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={rescheduleData.time}
                                                onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleReschedule(appointmentId)}
                                            disabled={updatingId === appointmentId}
                                            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            {updatingId === appointmentId ? 'Updating...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsRescheduling(null);
                                                setRescheduleData({ date: '', time: '' });
                                            }}
                                            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div key={appointmentId} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:shadow-md transition-shadow">
                                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                                        <Stethoscope className="w-9 h-9 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{appointmentName}</h3>
                                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full w-fit">
                                                {apt.status === 'past' ? 'Past' : 'Upcoming'}
                                            </span>
                                        </div>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-3">{specialty}</p>

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
                                                {location}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <button
                                            onClick={() => startReschedule(apt)}
                                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Update
                                        </button>
                                        <button
                                            onClick={() => setAppointmentToDelete(appointmentId)}
                                            disabled={cancellingId === appointmentId}
                                            className="flex-1 px-4 py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-70"
                                        >
                                            {cancellingId === appointmentId ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : null}

                <div className="mt-8 text-center" />
            </div>
        </div>
    );
}

export default Appointments;
