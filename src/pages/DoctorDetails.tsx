import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Mail, Phone, Save, Stethoscope, UserRound } from 'lucide-react';
import BackButton from '../components/BackButton';
import { logActivitySafely } from '../utils/logging';

const DEFAULT_API_BASE_URL = 'http://100.50.8.161:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

function DoctorDetails() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        specialization: '',
        hospital: '',
        phone: '',
        licenseNo: '',
        experienceYears: '',
        bio: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const name = localStorage.getItem('userName') || 'Doctor';
            const email = localStorage.getItem('userEmail') || '';

            if (!token) {
                throw new Error('Please log in again to continue.');
            }

            const response = await fetch(`${API_BASE_URL}/doctors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    specialization: formData.specialization,
                    phone: formData.phone,
                    hospital: formData.hospital,
                    license_no: formData.licenseNo || null,
                    experience_years: formData.experienceYears ? Number(formData.experienceYears) : null,
                    bio: formData.bio || null,
                })
            });

            const responseText = await response.text();
            const responseData = responseText ? JSON.parse(responseText) : null;

            if (!response.ok) {
                throw new Error(responseData?.detail || 'Failed to save doctor details.');
            }

            await logActivitySafely({
                action: 'doctor_profile_saved',
                activity_type: 'doctor_profile',
                description: `Doctor profile saved for ${name}.`,
                metadata: {
                    doctor_name: name,
                    email,
                    specialization: formData.specialization,
                    hospital: formData.hospital,
                    phone: formData.phone,
                    license_no: formData.licenseNo || null,
                    experience_years: formData.experienceYears ? Number(formData.experienceYears) : null
                }
            });

            navigate('/dashboard');
        } catch (submitError) {
            console.error('Failed to save doctor details:', submitError);
            setError(submitError instanceof Error ? submitError.message : 'Unable to save doctor details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-10 text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-lg">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Doctor Profile</h2>
                        <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
                            Add the professional details patients should see when they view your profile.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 sm:p-12">
                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <UserRound className="w-5 h-5 text-emerald-500" />
                                    Professional Information
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Specialization</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="specialization"
                                        required
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        placeholder="Cardiologist"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <Stethoscope className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hospital / Clinic</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="hospital"
                                        required
                                        value={formData.hospital}
                                        onChange={handleChange}
                                        placeholder="City Heart Care Center"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={localStorage.getItem('userEmail') || ''}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none pl-11"
                                    />
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">License Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="licenseNo"
                                        value={formData.licenseNo}
                                        onChange={handleChange}
                                        placeholder="MD-12345-CA"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <FileText className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Experience (Years)</label>
                                <input
                                    type="number"
                                    name="experienceYears"
                                    value={formData.experienceYears}
                                    onChange={handleChange}
                                    placeholder="10"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Short Bio</label>
                                <textarea
                                    name="bio"
                                    rows={4}
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell patients about your experience, care approach, and areas of focus."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-12 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 rounded-xl text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                disabled={loading}
                            >
                                Skip for now
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Doctor Details
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default DoctorDetails;
