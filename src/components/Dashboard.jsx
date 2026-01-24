import React from 'react';
import { Link } from 'react-router-dom';


const Dashboard = () => {
  // Emergency contact buttons handler
  const handleEmergencyAction = (action) => {
    let message = '';
    let confirmMessage = '';

    switch (action) {
      case 'call911':
        confirmMessage = 'Call 911 emergency services?';
        message = 'Calling 911... Please wait for emergency services.';
        break;
      case 'alertDoctor':
        confirmMessage = 'Send emergency alert to your doctor?';
        message = 'Emergency alert sent to Dr. Williams. They will contact you shortly.';
        break;
      case 'notifyFamily':
        confirmMessage = 'Notify all family emergency contacts?';
        message = 'Emergency notification sent to John and Sarah. They have been alerted.';
        break;
      default:
        return;
    }

    if (window.confirm(confirmMessage)) {
      alert(message);
    }
  };

  const handleSOSClick = (e) => {
    if (!window.confirm('Are you sure you want to activate emergency SOS? This will alert your emergency contacts.')) {
      e.preventDefault();
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <i className="fas fa-shield-alt"></i> ElderSafe
        </div>
        <div className="welcome-section">
          <h1>Welcome back, Margaret</h1>
          <p>Your complete health dashboard</p>
        </div>
      </header>

      {/* Emergency Card */}
      <div className="emergency-card">
        <div className="emergency-info">
          <h3><i className="fas fa-exclamation-triangle"></i> Emergency Contacts</h3>
          <p>In case of emergency, contact your designated responders:</p>
          <p><strong>Primary:</strong> John (Son) - (555) 123-4567</p>
          <p><strong>Secondary:</strong> Sarah (Daughter) - (555) 987-6543</p>
          <div className="emergency-contact">
            <button
              className="contact-btn call"
              onClick={() => handleEmergencyAction('call911')}
            >
              <i className="fas fa-phone"></i> Call 911
            </button>
            <button
              className="contact-btn"
              onClick={() => handleEmergencyAction('alertDoctor')}
            >
              <i className="fas fa-user-md"></i> Alert Doctor
            </button>
            <button
              className="contact-btn"
              onClick={() => handleEmergencyAction('notifyFamily')}
            >
              <i className="fas fa-users"></i> Notify Family
            </button>
          </div>
        </div>
        <div>
          <Link to="/emergency" className="sos-button" onClick={handleSOSClick}>
            <i className="fas fa-plus"></i>
            <span>SOS</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Health Overview Card */}
        <Link to="/health-overview" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon health-icon">
              <i className="fas fa-heartbeat"></i>
            </div>
            <div>
              <div className="card-title">Health Overview</div>
              <div className="card-subtitle">Current vital statistics</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">3 Metrics</div>
            <div className="card-label">Heart Rate, BP, Glucose</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">All Normal</div>
            <div className="view-link">View Details <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>

        {/* Health Log Card */}
        <Link to="/health-log" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon log-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div>
              <div className="card-title">Health Log</div>
              <div className="card-subtitle">Daily activities & records</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">12 Entries</div>
            <div className="card-label">Today's activities</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">Up to date</div>
            <div className="view-link">View Log <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>

        {/* Trends Card */}
        <Link to="/trends" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon trends-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <div className="card-title">Trends</div>
              <div className="card-subtitle">Health metrics over time</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">7 Charts</div>
            <div className="card-label">Weekly & monthly data</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">Stable</div>
            <div className="view-link">View Trends <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>

        {/* Appointments Card */}
        <Link to="/appointments" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon appointments-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div>
              <div className="card-title">Appointments</div>
              <div className="card-subtitle">Upcoming medical visits</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">3 Scheduled</div>
            <div className="card-label">Next: Tomorrow 10 AM</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">On schedule</div>
            <div className="view-link">View All <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>

        {/* Health Reminder Card */}
        <Link to="/reminders" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon reminder-icon">
              <i className="fas fa-bell"></i>
            </div>
            <div>
              <div className="card-title">Health Reminders</div>
              <div className="card-subtitle">Medications & alerts</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">5 Active</div>
            <div className="card-label">Next: 6:00 PM today</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">All set</div>
            <div className="view-link">View Reminders <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>

        {/* Weekly Average Card */}
        <Link to="/weekly-average" className="dashboard-card">
          <div className="card-header">
            <div className="card-icon weekly-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div>
              <div className="card-title">Weekly Average</div>
              <div className="card-subtitle">Overall health score</div>
            </div>
          </div>
          <div className="card-content">
            <div className="card-value">85%</div>
            <div className="card-label">Good - Within normal range</div>
          </div>
          <div className="card-footer">
            <div className="status-indicator status-normal">Good</div>
            <div className="view-link">View Details <i className="fas fa-arrow-right"></i></div>
          </div>
        </Link>
      </div>

      {/* Fixed SOS Button */}
      <div className="sos-button-container">
        <Link to="/emergency" className="sos-button" onClick={handleSOSClick}>
          <i className="fas fa-plus"></i>
          <span>SOS</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;