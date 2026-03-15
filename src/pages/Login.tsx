import { useState } from 'react';
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const [role, setRole] = useState('patient');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        console.log("login function triggered");
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    username: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                console.log("TOKEN RECEIVED", data.access_token);
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("userRole", role);
                localStorage.setItem("isAuthenticated", "true");

                // Fetch user data
                try {
                    const userResponse = await fetch("http://127.0.0.1:8000/users/me", {
                        headers: {
                            "Authorization": `Bearer ${data.access_token}`
                        }
                    });
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        localStorage.setItem("userName", userData.name);
                    }
                } catch (userError) {
                    console.error("Failed to fetch user data:", userError);
                }

                if (rememberMe) {
                    localStorage.setItem("rememberEmail", email);
                } else {
                    localStorage.removeItem("rememberEmail");
                }

                navigate("/dashboard");
            } else {
                alert("Invalid email or password");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Server error. Check backend.");
        }

        setLoading(false);
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
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Sign in to access your health dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>

                        {/* Role Selector */}
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

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-slate-600 dark:text-slate-400 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="mr-2 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Remember me
                            </label>

                            <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                                Forgot password?
                            </a>
                        {/* Remember Me and Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                                />
                                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                            >
                                Forgot password?
                            </Link>
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
                            <Link
                                to="/register"
                                className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors"
                            >
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