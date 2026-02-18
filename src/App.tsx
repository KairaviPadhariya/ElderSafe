import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import NotificationsPanel from './components/NotificationsPanel';
import ProfilePanel from './components/ProfilePanel';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import MedicalDetails from './pages/MedicalDetails';
import Appointments from './pages/Appointments';
import DailyLogs from './pages/DailyLogs';
import HealthTrends from './pages/HealthTrends';
import Doctors from './pages/Doctors';
import Medications from './pages/Medications';
import MedicalHistory from './pages/MedicalHistory';
import LandingPage from './pages/LandingPage';

function DashboardLayout() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header
        onNotificationsClick={() => setShowNotifications(true)}
        onProfileClick={() => setShowProfile(true)}
      />

      <Dashboard />

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <ProfilePanel
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
          <Route path="/medical-details" element={<MedicalDetails />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/daily-logs" element={<DailyLogs />} />
          <Route path="/health-trends" element={<HealthTrends />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/medical-history" element={<MedicalHistory />} />
          <Route path="/dashboard" element={<DashboardLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
