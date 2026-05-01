
import { Stethoscope, Mail, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import BackButton from '../components/BackButton';
import { logActivitySafely } from '../utils/logging';

const DEFAULT_API_BASE_URL = 'http://10.22.60.236:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

type Doctor = {
    _id?: string;
    id?: string | number;
    user_id?: string;
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string;
    bio?: string | null;
};

function Doctors() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const loadDoctors = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/doctors`);
                const data = await response.json();

                if (response.ok && Array.isArray(data)) {
                    setDoctors(data);
                }
            } catch (error) {
                console.error('Failed to load doctors:', error);
            }
        };

        loadDoctors();
    }, []);

    const openMessageComposer = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setMessageText('');
        setMessageError('');
        setSuccessMessage('');
    };

    const closeMessageComposer = () => {
        if (isSending) {
            return;
        }

        setSelectedDoctor(null);
        setMessageText('');
        setMessageError('');
    };

    const handleSendMessage = async () => {
        const trimmedMessage = messageText.trim();

        if (!selectedDoctor) {
            return;
        }

        if (!trimmedMessage) {
            setMessageError('Please write a message before sending.');
            return;
        }

        if (!selectedDoctor.user_id) {
            setMessageError('This doctor cannot receive notifications yet.');
            return;
        }

        const token = localStorage.getItem('token');
        const senderName = localStorage.getItem('userName') || 'A patient';

        if (!token) {
            setMessageError('Please log in again to send a message.');
            return;
        }

        setIsSending(true);
        setMessageError('');

        try {
            const response = await fetch(`${API_BASE_URL}/notifications`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: selectedDoctor.user_id,
                    title: `New message from ${senderName}`,
                    message: trimmedMessage,
                    type: 'message',
                    priority: 'medium',
                }),
            });

            const responseText = await response.text();
            const responseData = responseText ? JSON.parse(responseText) : null;

            if (!response.ok) {
                throw new Error(responseData?.detail || 'Failed to send message.');
            }

            await logActivitySafely({
                action: 'doctor_message_sent',
                activity_type: 'doctor_message',
                description: `Message sent to Dr. ${selectedDoctor.name}.`,
                metadata: {
                    doctor_id: selectedDoctor._id || selectedDoctor.id || null,
                    doctor_user_id: selectedDoctor.user_id || null,
                    doctor_name: selectedDoctor.name,
                    specialization: selectedDoctor.specialization,
                    hospital: selectedDoctor.hospital,
                    message_length: trimmedMessage.length
                }
            });

            setSuccessMessage(`Message sent to ${selectedDoctor.name}.`);
            setSelectedDoctor(null);
            setMessageText('');
            window.dispatchEvent(new CustomEvent('notifications-updated'));
        } catch (error) {
            console.error('Failed to send doctor message:', error);
            setMessageError(error instanceof Error ? error.message : 'Failed to send message.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <BackButton />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-emerald-500" />
                        My Doctors
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Your healthcare team</p>
                </div>

                {successMessage && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doc) => (
                        <div key={doc.id || doc._id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                                    <Stethoscope className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{doc.name}</h3>
                                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-1">{doc.specialization}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{doc.hospital}</p>

                                <div className="w-full space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => openMessageComposer(doc)}
                                        className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedDoctor && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={closeMessageComposer}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Message {selectedDoctor.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Send a message that will appear in this doctor&apos;s notifications.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeMessageComposer}
                                    className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                    disabled={isSending}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                Notification target: {selectedDoctor.name}
                            </div>

                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Your message
                            </label>
                            <textarea
                                rows={5}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Write the message you want to send to this doctor."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white"
                            />

                            {messageError && (
                                <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                                    {messageError}
                                </p>
                            )}

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeMessageComposer}
                                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                    disabled={isSending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    disabled={isSending}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <Send className="h-4 w-4" />
                                    {isSending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Doctors;
