import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './components/Dashboard';
import HealthOverview from './components/HealthOverview';
import HealthLog from './components/HealthLog';
import Trends from './components/Trends';
import Appointments from './components/Appointments';
import Reminders from './components/Reminders';
import WeeklyAverage from './components/WeeklyAverage';
import EmergencySOS from './components/EmergencySOS';
import FamilyDashboard from './pages/FamilyDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Senior Routes - Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/health-overview" element={<ProtectedRoute><HealthOverview /></ProtectedRoute>} />
          <Route path="/health-log" element={<ProtectedRoute><HealthLog /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/weekly-average" element={<ProtectedRoute><WeeklyAverage /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute><EmergencySOS /></ProtectedRoute>} />

          {/* Role Specific Routes */}
          <Route path="/family-dashboard" element={<ProtectedRoute><FamilyDashboard /></ProtectedRoute>} />
          <Route path="/doctor-dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;