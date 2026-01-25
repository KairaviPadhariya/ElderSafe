import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [role, setRole] = useState('senior');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Mock login logic
        const userData = {
            name: role === 'senior' ? 'Margaret' : role === 'doctor' ? 'Dr. Williams' : 'John Smith',
            email: email,
            id: '123'
        };
        login(userData, role);
    };

    return (
        <div className="auth-container">
            <div className="auth-sidebar">
                <div style={{ zIndex: 2 }}>
                    <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>ElderSafe</h1>
                    <p style={{ fontSize: '24px', opacity: 0.9 }}>Connect, Monitor, and Care.</p>
                    <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                        <div>
                            <h3><i className="fas fa-heartbeat"></i> Vitals</h3>
                            <p>Real-time health monitoring</p>
                        </div>
                        <div>
                            <h3><i className="fas fa-shield-alt"></i> Safety</h3>
                            <p>24/7 Emergency response</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-content">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>Welcome Back</h1>
                        <p>Please sign in to continue</p>
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
                            <label>Email Address / Phone</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={role === 'senior' ? "(555) 123-4567" : "name@example.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn">
                            Sign In <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/signup">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
