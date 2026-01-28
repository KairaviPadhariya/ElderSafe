import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

function MedicalHistory() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-pink-500" />
                        Medical History
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Your comprehensive health records</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="bg-pink-50 dark:bg-pink-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Records Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                        Your complete medical history will appear here once you've been consistent with your check-ups and data logging.
                    </p>
                    <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl hover:opacity-90 transition-opacity">
                        Upload Documents
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MedicalHistory;
