import { useAuth } from '../context/AuthContext';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();

    const patients = [
        { id: 1, name: "Margaret Doe", age: 72, risk: "Medium", lastVitals: "HR: 72, BP: 120/80", status: "Stable" },
        { id: 2, name: "Robert Johnson", age: 78, risk: "High", lastVitals: "HR: 95, BP: 150/95", status: "Alert" },
        { id: 3, name: "Emily Davis", age: 68, risk: "Low", lastVitals: "HR: 68, BP: 115/75", status: "Stable" },
    ];

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="logo">
                    <i className="fas fa-user-md"></i> ElderSafe <span style={{ fontSize: '14px', marginLeft: '10px', background: '#dbeafe', padding: '4px 8px', borderRadius: '8px', color: '#1e40af' }}>Doctor Portal</span>
                </div>
                <div className="welcome-section" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <h1>{user?.name || 'Dr. Williams'}</h1>
                        <p>Cardiologist • 3 Patients Active</p>
                    </div>
                    <button onClick={logout} className="status-indicator" style={{ background: '#f3f4f6', cursor: 'pointer' }}>
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="section-header">
                <h2>Patient Overview</h2>
            </div>

            <table className="history-table">
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Age</th>
                        <th>Last Vitals</th>
                        <th>Risk Level</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(patient => (
                        <tr key={patient.id}>
                            <td style={{ fontWeight: '600' }}>{patient.name}</td>
                            <td>{patient.age}</td>
                            <td>{patient.lastVitals}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px',
                                    background: patient.risk === 'High' ? '#fee2e2' : patient.risk === 'Medium' ? '#fef3c7' : '#dcfce7',
                                    color: patient.risk === 'High' ? '#b91c1c' : patient.risk === 'Medium' ? '#92400e' : '#15803d',
                                    fontWeight: '700', fontSize: '14px'
                                }}>
                                    {patient.risk}
                                </span>
                            </td>
                            <td>
                                {patient.status === 'Alert' ? <span style={{ color: '#dc2626', fontWeight: 'bold' }}><i className="fas fa-exclamation-circle"></i> Attention Needed</span> : 'Normal'}
                            </td>
                            <td>
                                <button className="status-btn" style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '14px' }}>
                                    View Logs
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DoctorDashboard;
