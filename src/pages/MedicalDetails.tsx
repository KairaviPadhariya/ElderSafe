import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Heart, Scale, Thermometer, User, Save, Clipboard } from 'lucide-react';

function MedicalDetails() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: '',
        gender: '',
        height: '',
        weight: '',
        bmi: '',
        bloodGroup: '',
        o2Saturation: '',
        heartRate: '',
        sbp: '120',
        dbp: '80',
        fbs: '',
        ppbs: '',
        cholesterol: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Calculate BMI whenever height or weight changes
    useEffect(() => {
        if (formData.height && formData.weight) {
            const heightInMeters = parseFloat(formData.height) / 100;
            const weightInKg = parseFloat(formData.weight);

            if (heightInMeters > 0 && weightInKg > 0) {
                const calculatedBmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                setFormData(prev => ({ ...prev, bmi: calculatedBmi }));
            }
        } else {
            setFormData(prev => ({ ...prev, bmi: '' }));
        }
    }, [formData.height, formData.weight]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock save delay
        setTimeout(() => {
            setLoading(false);
            navigate('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-10 text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-lg">
                            <Clipboard className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Medical Profile</h2>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Please provide your medical details to help us personalize your health monitoring.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 sm:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Personal Information */}
                            <div className="lg:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <User className="w-5 h-5 text-emerald-500" />
                                    Personal Information
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="Years"
                                    value={formData.age}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                                <select
                                    name="gender"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="height"
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                        placeholder="175"
                                        value={formData.height}
                                        onChange={handleChange}
                                    />
                                    <Scale className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="weight"
                                        step="0.1"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                        placeholder="70.5"
                                        value={formData.weight}
                                        onChange={handleChange}
                                    />
                                    <Scale className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            {/* Vitals */}
                            <div className="lg:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2 mt-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                    Vital Metrics
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">BMI</label>
                                <input
                                    type="text"
                                    name="bmi"
                                    readOnly
                                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                                    placeholder="Calculated automatically"
                                    value={formData.bmi}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">O2 Saturation (%)</label>
                                <input
                                    type="number"
                                    name="o2Saturation"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="98"
                                    value={formData.o2Saturation}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Heart Rate (bpm)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="heartRate"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none pl-11"
                                        placeholder="72"
                                        value={formData.heartRate}
                                        onChange={handleChange}
                                    />
                                    <Heart className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>

                            {/* Blood Pressure */}
                            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">SBP (mmHg)</label>
                                    <input
                                        type="number"
                                        name="sbp"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                        placeholder="120"
                                        value={formData.sbp}
                                        onChange={handleChange}
                                    />
                                    <p className="text-xs text-slate-500">Systolic Blood Pressure</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">DBP (mmHg)</label>
                                    <input
                                        type="number"
                                        name="dbp"
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                        placeholder="80"
                                        value={formData.dbp}
                                        onChange={handleChange}
                                    />
                                    <p className="text-xs text-slate-500">Diastolic Blood Pressure</p>
                                </div>
                            </div>

                            {/* Other Metrics */}
                            <div className="lg:col-span-3 pb-2 border-b border-slate-100 dark:border-slate-700 mb-2 mt-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-emerald-500" />
                                    Clinical Measurements
                                </h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fasting Blood Sugar</label>
                                <input
                                    type="number"
                                    name="fbs"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="Before meal (mg/dL)"
                                    value={formData.fbs}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Post-Prandial Sugar</label>
                                <input
                                    type="number"
                                    name="ppbs"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="2hr after meal (mg/dL)"
                                    value={formData.ppbs}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cholesterol</label>
                                <input
                                    type="number"
                                    name="cholesterol"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="Total (mg/dL)"
                                    value={formData.cholesterol}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="mt-12 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
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
                                        Save Medical Details
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

export default MedicalDetails;
