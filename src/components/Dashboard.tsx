import { useEffect, useState } from 'react';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import FamilyDashboard from './FamilyDashboard';

function Dashboard() {
  const [role, setRole] = useState('patient');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  if (role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (role === 'family') {
    return <FamilyDashboard />;
  }

  return <PatientDashboard />;
}

export default Dashboard;
