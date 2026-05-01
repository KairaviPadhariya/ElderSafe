import { useState } from 'react';
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, decodeJWT } from '../utils/api';

const DEFAULT_API_BASE_URL = 'http://10.22.60.236:8000';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  const normalizedEmail = email.trim();

  try {
    const data = await api.login({
      email: normalizedEmail,
      password
    });

    if (data.access_token) {
      const fallbackUserName = normalizedEmail.split("@")[0] || normalizedEmail || "User";

      // Save token
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userName", fallbackUserName);
      localStorage.setItem("userEmail", normalizedEmail);

      // Decode JWT
      const decoded = decodeJWT(data.access_token);

      // Save role if available
      if (decoded && decoded.role) {
        localStorage.setItem("userRole", decoded.role);
      }

      try {
        const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`
          }
        });

        if (userResponse.ok) {
              const userData = await userResponse.json();

              console.log("User API response:", userData);

              const resolvedUserName =
                userData.name ||
                userData.full_name ||
                userData.username ||
                userData.email?.split("@")[0] ||
                normalizedEmail.split("@")[0] ||
                normalizedEmail ||
                "User";

              localStorage.setItem("userName", resolvedUserName);
              if (userData.email) {
                localStorage.setItem("userEmail", userData.email);
              }
        } else {
              console.warn("Failed to fetch user data:", userResponse.status);
        }
      } catch (userError) {
        console.error("Failed to fetch user data:", userError);
        localStorage.setItem("userName", fallbackUserName);
      }

      // Remember email
      if (rememberMe) {
        localStorage.setItem("rememberEmail", normalizedEmail);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // Navigate after everything stored
      navigate("/dashboard");

    } else {
      setError("Invalid email or password");
    }

  } catch (error) {
    console.error("Login error:", error);
    setError(error instanceof Error ? error.message : "Server error. Check backend.");
  }

  setLoading(false);
};

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="p-8 sm:p-10">

                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-2xl shadow-lg">
                            <Heart className="w-8 h-8 text-white" fill="white" />
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Sign in to access your health dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
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
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="••••••••"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-slate-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-slate-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 border-slate-300 rounded"
                                />
                                <span className="ml-2 text-sm text-slate-600">Remember me</span>
                            </label>

                            <Link
                                to="/forgot-password"
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                    </form>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-600">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-bold text-emerald-600 hover:text-emerald-500"
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
