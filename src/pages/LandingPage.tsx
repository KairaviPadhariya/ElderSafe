import { Heart, Users, Shield, TrendingUp, Mail, Phone, MapPin, ArrowRight, Stethoscope, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-50 border-b-2 border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Heart className="w-8 h-8 text-emerald-600" fill="currentColor" />
                            <span className="text-2xl font-bold text-slate-900">ElderSafe</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#about" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">About Us</a>
                            <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Features</a>
                            <a href="#contact" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Contact</a>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                            Comprehensive Health Management for Seniors
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                            ElderSafe is a trusted platform designed to help seniors monitor their health, manage medications, and stay connected with their healthcare providers.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="border-2 border-slate-300 text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl p-12 shadow-xl border border-emerald-200">
                            <Heart className="w-24 h-24 text-emerald-500 opacity-20 mb-6" />
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
                                    <p className="text-sm font-semibold text-slate-600">Heart Rate</p>
                                    <p className="text-3xl font-bold text-blue-600">72 BPM</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-md border border-emerald-100">
                                    <p className="text-sm font-semibold text-slate-600">Blood Pressure</p>
                                    <p className="text-3xl font-bold text-emerald-600">120/80 mmHg</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 shadow-md border border-violet-100">
                                    <p className="text-sm font-semibold text-slate-600">Status</p>
                                    <p className="text-3xl font-bold text-violet-600">Healthy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="bg-gradient-to-b from-slate-50 to-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">About ElderSafe</h2>
                        <p className="text-xl text-slate-600">Empowering seniors with technology for better health outcomes</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
                            <Shield className="w-12 h-12 text-blue-500 mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Secure & Reliable</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Your health data is protected with enterprise-grade encryption and HIPAA compliance standards to ensure your privacy and security.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-emerald-500">
                            <Users className="w-12 h-12 text-emerald-500 mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Family Connected</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Share health updates with family members and healthcare providers. Keep your loved ones informed about your wellbeing.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-violet-500">
                            <TrendingUp className="w-12 h-12 text-violet-500 mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Track Progress</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Monitor health trends over time with visual charts and insights. Get alerts when your health metrics need attention.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-10 shadow-lg border border-emerald-100">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Our Mission</h3>
                        <p className="text-slate-600 text-lg leading-relaxed mb-6">
                            ElderSafe is dedicated to improving the quality of life for seniors by providing an intuitive, comprehensive health management platform. We believe that technology should empower older adults to take control of their health, stay connected with healthcare providers, and maintain independence.
                        </p>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            Our platform combines user-friendly design with powerful features to help seniors manage medications, track vital signs, schedule appointments, and maintain their health records in one secure place.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Key Features</h2>
                    <p className="text-xl text-slate-600">Everything you need for comprehensive health management</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="flex gap-6 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                                <Heart className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Health Tracking</h4>
                            <p className="text-slate-600">Monitor vital signs including heart rate, blood pressure, and glucose levels with daily logging capabilities.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Doctor Management</h4>
                            <p className="text-slate-600">Store doctor information, schedule appointments, and manage your healthcare provider network.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
                                <Clock className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Medication Reminders</h4>
                            <p className="text-slate-600">Never miss a dose with smart reminders for your medications and a complete prescription history.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-100">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                                <Award className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Health Insights</h4>
                            <p className="text-slate-600">Get personalized health trends and insights based on your tracked data to make informed decisions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="bg-gradient-to-b from-slate-50 to-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h2>
                        <p className="text-xl text-slate-600">Have questions? We'd love to hear from you</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-8">Get in Touch</h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <Mail className="w-6 h-6 text-emerald-500 mt-1" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-1">Email</h4>
                                        <p className="text-slate-600">support@eldersafe.com</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <Phone className="w-6 h-6 text-emerald-500 mt-1" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-1">Phone</h4>
                                        <p className="text-slate-600">+91 (98765) 43210</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <MapPin className="w-6 h-6 text-emerald-500 mt-1" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900 mb-1">Office</h4>
                                        <p className="text-slate-600">Bangalore, Karnataka 560001</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="font-semibold text-slate-900 mb-2">Response Time</h4>
                                <p className="text-slate-600 text-sm">We typically respond to all inquiries within 24-48 hours during business days.</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                            <form className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                                        placeholder="Your message..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md"
                                >
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="w-6 h-6 text-emerald-500" fill="currentColor" />
                                <span className="text-xl font-bold">ElderSafe</span>
                            </div>
                            <p className="text-slate-400">Empowering seniors with technology for better health outcomes.</p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
                        <p>&copy; 2026 ElderSafe. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
