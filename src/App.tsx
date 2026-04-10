import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import NotificationsPanel from './components/NotificationsPanel';
import ProfilePanel from './components/ProfilePanel';
<<<<<<< HEAD
import Dashboard from './components/Dashboard';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
=======
import Dashboard from './components/Dashboard.tsx';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
>>>>>>> hima
import MedicalDetails from './pages/MedicalDetails';
import DoctorDetails from './pages/DoctorDetails';
import FamilyDetails from './pages/FamilyDetails';
import Appointments from './pages/Appointments';
import DailyLogs from './pages/DailyLogs';
import HealthTrends from './pages/HealthTrends';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import Medications from './pages/Medications';
import MedicalHistory from './pages/MedicalHistory';
import LandingPage from './pages/LandingPage';
import PlaceholderPage from './pages/PlaceholderPage';

function DashboardLayout() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const role = localStorage.getItem('userRole') || 'patient';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      <Header
        role={role}
        onNotificationsClick={() => setShowNotifications(true)}
        onProfileClick={() => setShowProfile(true)}
      />

      <Dashboard />

      <NotificationsPanel
        role={role}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ProfilePanel
        role={role}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

    </div>
  );
}

function App() {
  return (
    <ThemeProvider>

      <Router>

        <Routes>

          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>

            <Route path="/dashboard" element={<DashboardLayout />} />

            <Route element={<MainLayout />}>

              <Route path="/medical-details" element={<MedicalDetails />} />
              <Route path="/doctor-details" element={<DoctorDetails />} />
              <Route path="/family-details" element={<FamilyDetails />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/daily-logs" element={<DailyLogs />} />
              <Route path="/health-trends" element={<HealthTrends />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/medications" element={<Medications />} />
              <Route path="/medical-history" element={<MedicalHistory />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/reports" element={<PlaceholderPage />} />

            </Route>

          </Route>

          {/* Unknown Routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </Router>

    </ThemeProvider>
  );
}

export default App;
