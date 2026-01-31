import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
import MainLayout from './components/MainLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/medical-details" element={<MedicalDetails />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/daily-logs" element={<DailyLogs />} />
              <Route path="/health-trends" element={<HealthTrends />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/medications" element={<Medications />} />
              <Route path="/medical-history" element={<MedicalHistory />} />
              <Route path="/patients" element={<PlaceholderPage />} />
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
