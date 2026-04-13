import { useState } from 'react';
import NavHeader from './NavHeader';


const Appointments = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const appointments = [
    {
      id: 1,
      title: "Cardiology Checkup",
      doctor: "Dr. Williams - Heart Center",
      description: "Annual cardiac evaluation and EKG test",
      time: "Tomorrow, 10:00 AM",
      status: "upcoming",
      type: "today",
      icon: "fas fa-heart",
      iconClass: "today"
    },
    {
      id: 2,
      title: "Ophthalmology Visit",
      doctor: "Dr. Chen - Vision Clinic",
      description: "Annual eye exam and glaucoma screening",
      time: "Oct 28, 2:30 PM",
      status: "upcoming",
      type: "upcoming",
      icon: "fas fa-eye",
      iconClass: "upcoming"
    },
    {
      id: 3,
      title: "General Physician",
      doctor: "Dr. Rodriguez - Primary Care",
      description: "Regular checkup and medication review",
      time: "Nov 5, 11:00 AM",
      status: "upcoming",
      type: "upcoming",
      icon: "fas fa-stethoscope",
      iconClass: "upcoming"
    },
    {
      id: 4,
      title: "Dental Cleaning",
      doctor: "Dr. Miller - Family Dental",
      description: "Regular cleaning and oral examination",
      time: "Oct 15, 9:30 AM",
      status: "completed",
      type: "completed",
      icon: "fas fa-tooth",
      iconClass: "completed"
    },
    {
      id: 5,
      title: "Bone Density Test",
      doctor: "Dr. Thompson - Imaging Center",
      description: "Annual osteoporosis screening",
      time: "Sep 28, 1:15 PM",
      status: "completed",
      type: "completed",
      icon: "fas fa-x-ray",
      iconClass: "completed"
    }
  ];

  const stats = [
    { id: 1, value: "3", label: "Upcoming Appointments" },
    { id: 2, value: "7", label: "Completed This Year" },
    { id: 3, value: "100%", label: "Attendance Rate" },
    { id: 4, value: "15 min", label: "Average Wait Time" }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'upcoming') return appointment.status === 'upcoming';
    if (activeFilter === 'today') return appointment.type === 'today';
    if (activeFilter === 'completed') return appointment.status === 'completed';
    return true;
  });

  const handleAddAppointment = () => {
    alert('Schedule New Appointment functionality would open a form in a real application.');
  };

  return (
    <div className="appointments-container">
      <NavHeader
        title="Appointments"
        icon="fas fa-calendar-alt"
        backLink="/"
      />

      <div className="content-section">
        <div className="section-header">
          <div>
            <h2>Medical Appointments</h2>
            <p>Manage and track your healthcare visits</p>
          </div>
          <div className="status-filter">
            <button
              className={`status-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            <button
              className={`status-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`status-btn ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setActiveFilter('today')}
            >
              Today
            </button>
            <button
              className={`status-btn ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="appointment-cards">
          {filteredAppointments.map(appointment => (
            <div className={`appointment-card ${appointment.type}`} key={appointment.id}>
              <div className={`appointment-icon ${appointment.iconClass}`}>
                <i className={appointment.icon}></i>
              </div>
              <div className="appointment-details">
                <h4>{appointment.title}</h4>
                <p className="appointment-doctor">{appointment.doctor}</p>
                <p>{appointment.description}</p>
              </div>
              <div className="appointment-time">
                <div className="appointment-date">{appointment.time}</div>
                <span className={`appointment-status status-${appointment.type}`}>
                  {appointment.type === 'today' ? 'Upcoming' :
                    appointment.type === 'upcoming' ? 'Scheduled' : 'Completed'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button className="add-appointment-btn" onClick={handleAddAppointment}>
          <i className="fas fa-plus"></i> Schedule New Appointment
        </button>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h2>Appointment Statistics</h2>
          <p>Overview of your healthcare visits</p>
        </div>

        <div className="stats-grid">
          {stats.map(stat => (
            <div className="stat-card" key={stat.id}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
