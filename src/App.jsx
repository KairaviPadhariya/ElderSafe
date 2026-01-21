import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import HealthOverview from './components/HealthOverview';
import HealthLog from './components/HealthLog';
import Trends from './components/Trends';
import Appointments from './components/Appointments';
import Reminders from './components/Reminders';
import WeeklyAverage from './components/WeeklyAverage';
import EmergencySOS from './components/EmergencySOS';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/health-overview" element={<HealthOverview />} />
        <Route path="/health-log" element={<HealthLog />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/weekly-average" element={<WeeklyAverage />} />
        <Route path="/emergency" element={<EmergencySOS />} />
      </Routes>
    </div>
  );
}

export default App;