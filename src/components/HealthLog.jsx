import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NavHeader from './NavHeader';


const HealthLog = () => {
  const [activeDate, setActiveDate] = useState('today');

  const logEntries = [
    {
      id: 1,
      title: "Morning Medication",
      description: "Lisinopril 10mg, Atorvastatin 20mg, Aspirin 81mg",
      category: "Medication",
      time: "9:00 AM",
      date: "Today",
      icon: "fas fa-pills"
    },
    {
      id: 2,
      title: "Morning Walk",
      description: "30 minutes, 1.5 miles, moderate pace",
      category: "Exercise",
      time: "10:30 AM",
      date: "Today",
      icon: "fas fa-walking"
    },
    {
      id: 3,
      title: "Blood Pressure Check",
      description: "Measured with home monitor after resting 5 minutes",
      category: "Vitals",
      time: "2:00 PM",
      date: "Today",
      icon: "fas fa-heartbeat"
    },
    {
      id: 4,
      title: "Lunch",
      description: "Grilled chicken salad, whole grain bread, water",
      category: "Nutrition",
      time: "1:00 PM",
      date: "Today",
      icon: "fas fa-utensils"
    },
    {
      id: 5,
      title: "Afternoon Rest",
      description: "30 minute nap, woke up feeling refreshed",
      category: "Rest",
      time: "3:30 PM",
      date: "Today",
      icon: "fas fa-bed"
    }
  ];

  const summaryEntries = [
    {
      id: 1,
      title: "Medication Adherence",
      description: "28/28 doses taken this week (100% adherence)",
      icon: "fas fa-capsules",
      iconColor: "#3b82f6",
      bgColor: "#dbeafe"
    },
    {
      id: 2,
      title: "Exercise Total",
      description: "210 minutes of exercise this week (30 min/day average)",
      icon: "fas fa-running",
      iconColor: "#d97706",
      bgColor: "#fef3c7"
    },
    {
      id: 3,
      title: "Vitals Checked",
      description: "14 vitals readings recorded this week",
      icon: "fas fa-check-circle",
      iconColor: "#16a34a",
      bgColor: "#dcfce7"
    }
  ];

  const handleAddEntry = () => {
    alert('Add New Health Entry functionality would open a form in a real application.');
  };

  return (
    <div className="health-log-container">
      <NavHeader
        title="Health Log"
        icon="fas fa-clipboard-list"
        backLink="/"
      />

      <div className="content-section">
        <div className="section-header">
          <div>
            <h2>Daily Health Activities</h2>
            <p>Track your medications, exercises, and health checks</p>
          </div>
          <div className="date-selector">
            <button
              className={`date-btn ${activeDate === 'today' ? 'active' : ''}`}
              onClick={() => setActiveDate('today')}
            >
              Today
            </button>
            <button
              className={`date-btn ${activeDate === 'yesterday' ? 'active' : ''}`}
              onClick={() => setActiveDate('yesterday')}
            >
              Yesterday
            </button>
            <button
              className={`date-btn ${activeDate === 'week' ? 'active' : ''}`}
              onClick={() => setActiveDate('week')}
            >
              This Week
            </button>
            <button
              className={`date-btn ${activeDate === 'all' ? 'active' : ''}`}
              onClick={() => setActiveDate('all')}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="log-entries">
          {logEntries.map(entry => (
            <div className="log-entry" key={entry.id}>
              <div className="log-icon">
                <i className={entry.icon}></i>
              </div>
              <div className="log-details">
                <h4>{entry.title}</h4>
                <p>{entry.description}</p>
                <span className="log-category">{entry.category}</span>
              </div>
              <div className="log-time">
                <div className="time">{entry.time}</div>
                <div className="date">{entry.date}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="add-entry-btn" onClick={handleAddEntry}>
          <i className="fas fa-plus"></i> Add New Health Entry
        </button>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2>Weekly Summary</h2>
          <p>Your activity overview for the past 7 days</p>
        </div>

        <div className="log-entries">
          {summaryEntries.map(entry => (
            <div className="log-entry" key={entry.id}>
              <div className="log-icon" style={{ backgroundColor: entry.bgColor, color: entry.iconColor }}>
                <i className={entry.icon}></i>
              </div>
              <div className="log-details">
                <h4>{entry.title}</h4>
                <p>{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthLog;