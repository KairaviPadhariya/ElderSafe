import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';

function HealthTrends() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                        Health Trends
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Visualizing your vital metrics over time</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Placeholder Charts */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center min-h-[300px]">
                            <p className="text-slate-400 font-medium">Chart Placeholder {i}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HealthTrends;
