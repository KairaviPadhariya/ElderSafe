import { useEffect, useState } from 'react';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import FamilyDashboard from './FamilyDashboard';

function Dashboard() {
  const [role, setRole] = useState<string>('patient');
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');

    if (savedRole) {
      setRole(savedRole);
    }

    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  if (role === 'doctor') {
    return <DoctorDashboard userName={userName} />;
  }

  if (role === 'family') {
    return <FamilyDashboard userName={userName} />;
  }

  return <PatientDashboard userName={userName} />;
}

export default Dashboard;