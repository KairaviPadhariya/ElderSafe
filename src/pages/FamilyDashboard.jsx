import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const FamilyDashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="logo">
                    <i className="fas fa-shield-alt"></i> ElderSafe <span style={{ fontSize: '14px', marginLeft: '10px', background: '#dbeafe', padding: '4px 8px', borderRadius: '8px', color: '#1e40af' }}>Family View</span>
                </div>
                <div className="welcome-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <h1>Welcome, {user?.name || 'Family Member'}</h1>
                        <p>Monitoring: <strong>Margaret (Mother)</strong></p>
                    </div>
                    <button onClick={logout} className="status-indicator" style={{ background: '#f3f4f6', cursor: 'pointer' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Senior Status Card */}
            <div className="emergency-card" style={{ borderLeft: '8px solid #10b981', borderColor: '#d1fae5', background: '#f0fdf4' }}>
                <div className="emergency-info">
                    <h3 style={{ color: '#065f46' }}><i className="fas fa-check-circle"></i> Status: Safe</h3>
                    <p>Last Activity: <strong>Heart Rate Logged (72 bpm)</strong> - 10 minutes ago</p>
                    <p>Location: Home (123 Main St)</p>
                </div>
                <div>
                    <button className="contact-btn call">
                        <i className="fas fa-phone"></i> Call Margaret
                    </button>
                </div>
            </div>

            <div className="section-header">
                <h2>Latest Health Updates</h2>
            </div>

            <div className="dashboard-grid">
                {/* Reusing cards but for viewing only */}
                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-title">Heart Rate</div>
                        <div className="metric-trend trend-neutral">
                            Normal
                        </div>
                    </div>
                    <div className="metric-value">72 bpm</div>
                    <div className="metric-label">Today 2:30 PM</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-title">Blood Pressure</div>
                        <div className="metric-trend trend-neutral">
                            Stable
                        </div>
                    </div>
                    <div className="metric-value">120/80</div>
                    <div className="metric-label">Today 8:00 AM</div>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <div className="metric-title">Next Appointment</div>
                    </div>
                    <div className="metric-value" style={{ fontSize: '24px' }}>Cardiology</div>
                    <div className="metric-label">Tomorrow, 10:00 AM</div>
                </div>
            </div>
        </div>
    );
};

export default FamilyDashboard;
