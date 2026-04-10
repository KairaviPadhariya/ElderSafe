import { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './components/Dashboard.tsx';
import Header from './components/Header';
import MainLayout from './components/MainLayout';
import NotificationsPanel from './components/NotificationsPanel';
import ProfilePanel from './components/ProfilePanel';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import Appointments from './pages/Appointments';
import DailyLogs from './pages/DailyLogs';
import DoctorDetails from './pages/DoctorDetails';
import Doctors from './pages/Doctors';
import FamilyDetails from './pages/FamilyDetails';
import HealthTrends from './pages/HealthTrends';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login.tsx';
import MedicalDetails from './pages/MedicalDetails';
import MedicalHistory from './pages/MedicalHistory';
import Medications from './pages/Medications';
import Patients from './pages/Patients';
import PlaceholderPage from './pages/PlaceholderPage';
import Register from './pages/Register.tsx';

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
