import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type EmergencyContact = {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  address: string;
  type: string;
  icon: string;
};

type EmergencyService = {
  id: number;
  title: string;
  phone: string;
  type: string;
  icon: string;
};

type PatientEmergencyProfile = {
  emergency_contact_phone?: string | null;
};

const API_BASE_URL = 'http://127.0.0.1:8000';

const EmergencySOS = () => {
  const [countdownActive, setCountdownActive] = useState(false);
  const [seconds, setSeconds] = useState(3);
  const [emergencyActivated, setEmergencyActivated] = useState(false);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [profileContact, setProfileContact] = useState<EmergencyContact | null>(null);

  const fallbackContacts: EmergencyContact[] = [
    {
      id: 2,
      name: "John Smith",
      relationship: "Son / Primary Contact",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown",
      type: "primary",
      icon: "fas fa-user"
    },
    {
      id: 3,
      name: "Sarah Johnson",
      relationship: "Daughter / Secondary Contact",
      phone: "(555) 987-6543",
      address: "456 Oak Ave, Somewhere",
      type: "secondary",
      icon: "fas fa-user-female"
    },
    {
      id: 4,
      name: "Dr. Williams",
      relationship: "Primary Physician",
      phone: "(555) 456-7890",
      address: "Heart Center Medical",
      type: "medical",
      icon: "fas fa-user-md"
    }
  ];

  useEffect(() => {
    const loadEmergencyContact = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/patients/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const responseText = await response.text();
        const patientData = responseText ? JSON.parse(responseText) as PatientEmergencyProfile | null : null;

        if (!response.ok || !patientData?.emergency_contact_phone) {
          return;
        }

        setProfileContact({
          id: 1,
          name: 'Emergency Contact',
          relationship: 'Primary Contact',
          phone: patientData.emergency_contact_phone,
          address: 'Saved from profile',
          type: 'primary',
          icon: 'fas fa-user'
        });
      } catch (error) {
        console.error('Failed to load emergency contact:', error);
      }
    };

    loadEmergencyContact();
  }, []);

  const contacts = profileContact ? [profileContact, ...fallbackContacts] : fallbackContacts;

  const services: EmergencyService[] = [
    {
      id: 1,
      title: "Ambulance",
      phone: "911",
      type: "ambulance",
      icon: "fas fa-ambulance"
    },
    {
      id: 2,
      title: "Police",
      phone: "911",
      type: "police",
      icon: "fas fa-shield-alt"
    },
    {
      id: 3,
      title: "Fire Department",
      phone: "911",
      type: "fire",
      icon: "fas fa-fire-extinguisher"
    }
  ];

  const startPress = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const timer = window.setTimeout(() => {
      activateSOS();
    }, 3000);
    setPressTimer(timer);
  };

  const cancelPress = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const activateSOS = () => {
    if (countdownActive) return;

    const confirmed = window.confirm(
      'ACTIVATE EMERGENCY SOS?\n\nThis will:\n1. Call 911\n2. Alert all emergency contacts\n3. Share your location\n4. Send your medical information\n\nPress OK to activate emergency response.'
    );

    if (!confirmed) return;

    setCountdownActive(true);
  };

  useEffect(() => {
    let interval: number | undefined;
    if (countdownActive && seconds > 0) {
      interval = window.setInterval(() => {
        setSeconds(prev => prev - 1);
      }, 1000);
    } else if (seconds === 0 && countdownActive) {
      setEmergencyActivated(true);
      alert('EMERGENCY RESPONSE ACTIVATED!\n\n1. 911 has been called\n2. Emergency contacts notified\n3. Your location shared: 123 Main St, Apt 4B\n4. Medical information sent to responders\n\nStay calm. Help is on the way.');
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [countdownActive, seconds]);

  const handleContactAction = (action: 'call' | 'message', name: string, phone?: string) => {
    if (action === 'call') {
      if (window.confirm(`Call ${name} at ${phone}?`)) {
        alert(`Calling ${name}...`);
      }
    } else if (action === 'message') {
      if (window.confirm(`Send emergency message to ${name}?`)) {
        alert(`Emergency message sent to ${name}.`);
      }
    }
  };

  const handleServiceCall = (service: string) => {
    if (window.confirm(`Call ${service} emergency line (911)?`)) {
      alert(`Calling 911 for ${service}...`);
    }
  };

  return (
    <div className="emergency-sos-container">
      <div className="header">
        <Link to="/" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
        <h1><i className="fas fa-exclamation-triangle"></i> EMERGENCY SOS <i className="fas fa-exclamation-triangle"></i></h1>
        <p>This page is for emergencies only. Press the SOS button to alert your contacts and emergency services.</p>
      </div>

      {/* Main SOS Button */}
      <div className="main-sos-container">
        <button
          className="main-sos-button"
          onMouseDown={startPress}
          onTouchStart={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
        >
          <i className="fas fa-plus"></i>
          <span>EMERGENCY SOS</span>
        </button>
        <p className="sos-instruction">Press and hold for 3 seconds to activate emergency response</p>
      </div>

      {/* Countdown Timer */}
      {countdownActive && (
        <div className="countdown-section">
          {!emergencyActivated ? (
            <>
              <div className="countdown-title">Emergency Alert Activated!</div>
              <div className="countdown-timer">{seconds}</div>
              <div className="countdown-message">Emergency services and your contacts are being notified. Stay calm and wait for assistance.</div>
            </>
          ) : (
            <>
              <div className="countdown-title success-text">Emergency Response Activated!</div>
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="countdown-message">
                <p><strong>Emergency services have been alerted.</strong></p>
                <p>Your location and medical information have been shared with responders.</p>
                <p>Your emergency contacts have been notified.</p>
                <p className="warning-text">Stay calm and wait for assistance.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="contacts-section">
        <h2 className="section-title"><i className="fas fa-users"></i> Emergency Contacts</h2>
        <div className="contacts-grid">
          {contacts.map(contact => (
            <div className={`contact-card ${contact.type}`} key={contact.id}>
              <div className="contact-header">
                <div className={`contact-icon ${contact.type}`}>
                  <i className={contact.icon}></i>
                </div>
                <div>
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-relationship">{contact.relationship}</div>
                </div>
              </div>
              <div className="contact-details">
                <div className="contact-phone">
                  <i className="fas fa-phone"></i> {contact.phone}
                </div>
                <div className="contact-address">{contact.address}</div>
                <div className="contact-actions">
                  <button
                    className="contact-btn call-btn"
                    onClick={() => handleContactAction('call', contact.name, contact.phone)}
                  >
                    <i className="fas fa-phone"></i> Call
                  </button>
                  <button
                    className="contact-btn message-btn"
                    onClick={() => handleContactAction('message', contact.name)}
                  >
                    <i className="fas fa-comment"></i> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Services */}
      <div className="services-section">
        <h2 className="section-title"><i className="fas fa-ambulance"></i> Emergency Services</h2>
        <div className="services-grid">
          {services.map(service => (
            <div className="service-card" key={service.id}>
              <div className={`service-icon ${service.type}`}>
                <i className={service.icon}></i>
              </div>
              <div className="service-title">{service.title}</div>
              <div className="service-phone">{service.phone}</div>
              <button
                className="service-btn"
                onClick={() => handleServiceCall(service.title)}
              >
                <i className="fas fa-phone"></i> Call {service.title}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Information */}
      <div className="info-section">
        <h3 className="info-title"><i className="fas fa-info-circle"></i> Important Emergency Information</h3>
        <div className="info-content">
          <p><strong>In case of emergency:</strong></p>
          <ul>
            <li>Press the SOS button above to alert all emergency contacts</li>
            <li>If possible, provide your location: 123 Main Street, Apartment 4B</li>
            <li>Medical conditions: Hypertension, Type 2 Diabetes, Arthritis</li>
            <li>Medications: Lisinopril, Atorvastatin, Metformin</li>
            <li>Allergies: Penicillin, Sulfa drugs</li>
            <li>Insurance: Medicare #123-45-6789A</li>
          </ul>
          <p style={{ marginTop: '15px' }}>Your location is being tracked and will be shared with emergency responders when SOS is activated.</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencySOS;
