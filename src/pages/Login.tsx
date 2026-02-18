import { useState } from 'react';
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('patient'); // Default role
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock login delay
        setTimeout(() => {
            setLoading(false);
            navigate('/dashboard');
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userRole', role); // Use selected role
            navigate('/');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-slate-900/50 w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-8">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Heart className="w-8 h-8 text-white" fill="white" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400">Sign in to access your health dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Role Selector for Demo/Testing */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Login as</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Patient', 'Doctor', 'Family'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r.toLowerCase())}
                                        className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-medium border transition-all ${role === r.toLowerCase()
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-400'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200 dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                Remember me
                            </label>
                            <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-600 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
