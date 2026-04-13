import { useState } from 'react';
import { Link } from 'react-router-dom';

type ReminderType = 'medication' | 'appointment' | 'health-check';
type ReminderStatus = 'active' | 'pending' | 'completed';
type ReminderPriority = 'high' | 'medium' | 'low';

type Reminder = {
  id: number;
  title: string;
  description: string;
  time: string;
  type: ReminderType;
  status: ReminderStatus;
  icon: string;
  priority: ReminderPriority;
};

type ReminderStat = {
  id: number;
  value: string;
  label: string;
  type: 'active' | 'completed' | 'snoozed' | 'overdue';
};

const Reminders = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | ReminderType>('all');
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      title: "Evening Medication",
      description: "Take your prescribed evening medications with food",
      time: "Today at 6:00 PM",
      type: "medication",
      status: "active",
      icon: "fas fa-pills",
      priority: "high"
    },
    {
      id: 2,
      title: "Cardiology Appointment",
      description: "Annual cardiac evaluation at Heart Center",
      time: "Tomorrow at 10:00 AM",
      type: "appointment",
      status: "pending",
      icon: "fas fa-calendar-alt",
      priority: "high"
    },
    {
      id: 3,
      title: "Blood Pressure Check",
      description: "Daily morning blood pressure measurement",
      time: "Daily at 8:00 AM",
      type: "health-check",
      status: "active",
      icon: "fas fa-heartbeat",
      priority: "medium"
    },
    {
      id: 4,
      title: "Morning Medication",
      description: "Take Lisinopril, Atorvastatin, and Aspirin",
      time: "Daily at 9:00 AM",
      type: "medication",
      status: "completed",
      icon: "fas fa-capsules",
      priority: "medium"
    },
    {
      id: 5,
      title: "Weekly Weight Check",
      description: "Track your weight every Monday morning",
      time: "Every Monday at 7:00 AM",
      type: "health-check",
      status: "active",
      icon: "fas fa-weight",
      priority: "low"
    }
  ]);

  const stats: ReminderStat[] = [
    { id: 1, value: "5", label: "Active Reminders", type: "active" },
    { id: 2, value: "98%", label: "Completion Rate", type: "completed" },
    { id: 3, value: "2", label: "Snoozed Today", type: "snoozed" },
    { id: 4, value: "0", label: "Overdue", type: "overdue" }
  ];

  const filteredReminders = reminders.filter(reminder => {
    if (activeFilter === 'all') return true;
    return reminder.type === activeFilter;
  });

  const handleSnooze = (id: number) => {
    alert(`Reminder ${id} snoozed for 30 minutes.`);
  };

  const handleDismiss = (id: number) => {
    setReminders(reminders.map(reminder =>
      reminder.id === id ? { ...reminder, status: 'completed' } : reminder
    ));
    alert(`Reminder ${id} marked as completed.`);
  };

  const handleAddReminder = () => {
    alert('Add New Reminder functionality would open a form in a real application.');
  };

  const getPriorityClass = (priority: ReminderPriority) => {
    switch (priority) {
      case 'high': return 'priority-high-minimal';
      case 'medium': return 'priority-medium-minimal';
      case 'low': return 'priority-low-minimal';
      default: return 'priority-medium-minimal';
    }
  };

  const getStatusClass = (status: ReminderStatus) => {
    switch (status) {
      case 'active': return '';
      case 'pending': return 'pending';
      case 'completed': return 'completed';
      default: return '';
    }
  };

  return (
    <div className="reminders-minimal-container">
      {/* Navigation */}
      <div className="reminders-minimal-nav">
        <Link to="/" className="minimal-back-link">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
        <div className="minimal-page-title">
          <i className="fas fa-bell"></i> Health Reminders
        </div>
      </div>

      {/* Header */}
      <div className="reminders-minimal-header">
        <div className="minimal-header-text">
          <h1>Your Health Reminders</h1>
          <p>Never miss important health tasks and medications</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="minimal-filter-tabs">
        <button
          className={`minimal-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button
          className={`minimal-filter-btn ${activeFilter === 'medication' ? 'active' : ''}`}
          onClick={() => setActiveFilter('medication')}
        >
          Medication
        </button>
        <button
          className={`minimal-filter-btn ${activeFilter === 'appointment' ? 'active' : ''}`}
          onClick={() => setActiveFilter('appointment')}
        >
          Appointments
        </button>
        <button
          className={`minimal-filter-btn ${activeFilter === 'health-check' ? 'active' : ''}`}
          onClick={() => setActiveFilter('health-check')}
        >
          Health Checks
        </button>
      </div>

      {/* Reminders Grid */}
      <div className="reminders-minimal-grid">
        {filteredReminders.length > 0 ? (
          filteredReminders.map(reminder => (
            <div className="minimal-reminder-card" key={reminder.id}>
              <div className={`reminder-status-indicator ${getStatusClass(reminder.status)}`}></div>

              <div className="minimal-card-header">
                <div className={`reminder-type-icon ${reminder.type}`}>
                  <i className={reminder.icon}></i>
                </div>
                <div className="minimal-card-content">
                  <h3 className="reminder-minimal-title">{reminder.title}</h3>
                  <p className="reminder-minimal-desc">{reminder.description}</p>
                </div>
              </div>

              <div className="reminder-minimal-meta">
                <div className="reminder-minimal-time">
                  <i className="far fa-clock"></i>
                  <span>{reminder.time}</span>
                </div>
                <span className={`minimal-priority ${getPriorityClass(reminder.priority)}`}>
                  {reminder.priority}
                </span>
              </div>

              <div className="minimal-card-actions">
                <button
                  className="minimal-action-btn"
                  onClick={() => handleSnooze(reminder.id)}
                >
                  <i className="fas fa-clock"></i> Snooze
                </button>
                <button
                  className="minimal-action-btn primary"
                  onClick={() => handleDismiss(reminder.id)}
                >
                  <i className="fas fa-check"></i> Done
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="minimal-empty-state">
            <div className="minimal-empty-icon">
              <i className="far fa-bell"></i>
            </div>
            <h3 className="minimal-empty-title">No Reminders Found</h3>
            <p className="minimal-empty-text">
              {activeFilter === 'all'
                ? "You don't have any reminders yet. Add your first reminder to get started."
                : `No ${activeFilter} reminders found. Try a different filter.`}
            </p>
            <button className="minimal-empty-btn" onClick={handleAddReminder}>
              <i className="fas fa-plus"></i> Add First Reminder
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="reminders-minimal-stats">
        <div className="minimal-stats-header">
          <h2>Reminder Statistics</h2>
        </div>
        <div className="minimal-stats-grid">
          {stats.map(stat => (
            <div className="minimal-stat-item" key={stat.id}>
              <div className={`minimal-stat-icon ${stat.type}`}>
                <i className={`fas fa-${stat.type === 'active' ? 'bell' :
                    stat.type === 'completed' ? 'check-circle' :
                      stat.type === 'snoozed' ? 'clock' :
                        'exclamation-triangle'
                  }`}></i>
              </div>
              <div className="minimal-stat-value">{stat.value}</div>
              <div className="minimal-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="reminders-minimal-summary">
        <div className="minimal-summary-header">
          <h2>Reminder Overview</h2>
          <p>Distribution of your health tasks this week</p>
        </div>
        <div className="minimal-summary-grid">
          <div className="minimal-summary-card">
            <div className="summary-card-header">
              <i className="fas fa-pills"></i>
              <h3>Medication Reminders</h3>
            </div>
            <div className="minimal-summary-list">
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-capsules"></i>
                  Morning Pills
                </span>
                <span className="summary-item-value">Daily</span>
              </div>
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-tablets"></i>
                  Evening Medication
                </span>
                <span className="summary-item-value">6:00 PM</span>
              </div>
            </div>
          </div>

          <div className="minimal-summary-card">
            <div className="summary-card-header">
              <i className="fas fa-calendar-alt"></i>
              <h3>Appointments</h3>
            </div>
            <div className="minimal-summary-list">
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-heart"></i>
                  Cardiology
                </span>
                <span className="summary-item-value">Tomorrow</span>
              </div>
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-eye"></i>
                  Ophthalmology
                </span>
                <span className="summary-item-value">Oct 28</span>
              </div>
            </div>
          </div>

          <div className="minimal-summary-card">
            <div className="summary-card-header">
              <i className="fas fa-heartbeat"></i>
              <h3>Health Checks</h3>
            </div>
            <div className="minimal-summary-list">
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-tint"></i>
                  Blood Pressure
                </span>
                <span className="summary-item-value">Daily</span>
              </div>
              <div className="minimal-summary-item">
                <span className="summary-item-label">
                  <i className="fas fa-weight"></i>
                  Weight Check
                </span>
                <span className="summary-item-value">Weekly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="minimal-add-btn" onClick={handleAddReminder}>
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Reminders;
