import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SignupRole = 'senior' | 'family' | 'doctor';

type SignupFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    specialization: string;
};

const Signup = () => {
    const [role, setRole] = useState<SignupRole>('senior');
    const [formData, setFormData] = useState<SignupFormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        specialization: '', // For doctors
    });

    const { login } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Mock registration login
        const userData = {
            name: formData.name,
            email: formData.email,
            id: 'new-user'
        };
        login(userData, role);
    };

    return (
        <div className="auth-container">
            <div className="auth-sidebar">
                <div style={{ zIndex: 2 }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>Join ElderSafe</h1>
                    <p style={{ fontSize: '24px', opacity: 0.9 }}>Comprehensive care for your loved ones.</p>
                    <ul style={{ marginTop: '40px', listStyle: 'none', fontSize: '18px', gap: '15px', display: 'flex', flexDirection: 'column' }}>
                        <li><i className="fas fa-check-circle"></i> Daily Health Tracking</li>
                        <li><i className="fas fa-check-circle"></i> Emergency SOS Alerts</li>
                        <li><i className="fas fa-check-circle"></i> Medication Reminders</li>
                        <li><i className="fas fa-check-circle"></i> Family Connection</li>
                    </ul>
                </div>
            </div>

            <div className="auth-content">
                <div className="auth-card" style={{ maxWidth: '550px' }}>
                    <div className="auth-header">
                        <h1>Create Account</h1>
                        <p>Select your role to get started</p>
                    </div>

                    <div className="role-selector">
                        <button
                            className={`role-btn ${role === 'senior' ? 'active' : ''}`}
                            onClick={() => setRole('senior')}
                        >
                            <i className="fas fa-user"></i> Senior
                        </button>
                        <button
                            className={`role-btn ${role === 'family' ? 'active' : ''}`}
                            onClick={() => setRole('family')}
                        >
                            <i className="fas fa-users"></i> Family
                        </button>
                        <button
                            className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
                            onClick={() => setRole('doctor')}
                        >
                            <i className="fas fa-user-md"></i> Doctor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="John Doe"
                                required
                                onChange={handleChange}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="name@example.com"
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    className="form-input"
                                    placeholder="(555) 000-0000"
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {role === 'doctor' && (
                            <div className="form-group">
                                <label>Medical Specialization</label>
                                <input
                                    name="specialization"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Cardiologist"
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Create password"
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Confirm Password</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    className="form-input"
                                    placeholder="Confirm password"
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn">
                            Create Account
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
