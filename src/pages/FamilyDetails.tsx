import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, UserRound, Phone, MapPin, Save } from 'lucide-react';
import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://34.233.187.127:8000';

type Patient = {
    _id: string;
    name?: string;
};

function FamilyDetails() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        relation: '',
        accessLevel: 'Full Access',
        phone: '',
        address: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setPatients([]);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/patients`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const responseText = await response.text();
                const responseData = responseText ? JSON.parse(responseText) : [];

                if (!response.ok) {
                    throw new Error(responseData?.detail || 'Failed to load patients.');
                }

                setPatients(Array.isArray(responseData) ? responseData : []);
            } catch (loadError) {
                console.error('Failed to load patients:', loadError);
                setPatients([]);
            } finally {
                setPatientsLoading(false);
            }
        };

        loadPatients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const name = localStorage.getItem('userName') || 'Family Member';
            const email = localStorage.getItem('userEmail') || '';

            if (!token) {
                throw new Error('Please log in again to continue.');
            }

            const response = await fetch(`${API_BASE_URL}/family`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    email,
                    patient_id: formData.patientId || null,
                    patient_name: formData.patientName,
                    relation: formData.relation,
                    access_level: formData.accessLevel,
                    phone: formData.phone || null,
                    address: formData.address || null,
                })
            });

            const responseText = await response.text();
            const responseData = responseText ? JSON.parse(responseText) : null;

            if (!response.ok) {
                throw new Error(responseData?.detail || 'Failed to save family details.');
            }

            navigate('/dashboard');
        } catch (submitError) {
            console.error('Failed to save family details:', submitError);
            setError(submitError instanceof Error ? submitError.message : 'Unable to save family details.');
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
                            <HeartHandshake className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Family Profile</h2>
                        <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
                            Add the family and patient relationship details needed for caregiving access.
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
                                    Care Relationship
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Patient Name</label>
                                <select
                                    required
                                    value={formData.patientId}
                                    onChange={(e) => {
                                        const selectedPatient = patients.find((patient) => patient._id === e.target.value);
                                        setFormData((prev) => ({
                                            ...prev,
                                            patientId: e.target.value,
                                            patientName: selectedPatient?.name || ''
                                        }));
                                    }}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    disabled={patientsLoading || patients.length === 0}
                                >
                                    <option value="">
                                        {patientsLoading ? 'Loading patients...' : patients.length === 0 ? 'No patients found' : 'Select patient'}
                                    </option>
                                    {patients.map((patient) => (
                                        <option key={patient._id} value={patient._id}>
                                            {patient.name || 'Unnamed Patient'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Relation</label>
                                <input
                                    type="text"
                                    name="relation"
                                    required
                                    value={formData.relation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Access Level</label>
                                <div className="relative">
                                    <select
                                        name="accessLevel"
                                        value={formData.accessLevel}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    >
                                        <option value="Full Access">Full Access</option>
                                        <option value="View Only">View Only</option>
                                        <option value="Emergency Only">Emergency Only</option>
                                    </select>
                                    <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                                <div className="relative">
                                    <textarea
                                        name="address"
                                        rows={3}
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                    />
                                    <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
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
                                        Save Family Details
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

export default FamilyDetails;
