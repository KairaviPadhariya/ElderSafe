import { Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function getCurrentLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('Location unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve(`Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
      },
      () => {
        resolve('Location unavailable');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function SOSButton() {
  const [isPressed, setIsPressed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Location will be shared when available');

  const handleSOSClick = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setStatusMessage('Please log in again before sending an SOS alert.');
      return;
    }

    setIsPressed(true);
    setStatusMessage('Sending SOS alert to your family contact...');

    try {
      const location = await getCurrentLocation();
      const response = await fetch(`${API_BASE_URL}/sos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location,
          status: 'active'
        })
      });

      const responseText = await response.text();
      const responseData = responseText ? JSON.parse(responseText) : null;

      if (!response.ok) {
        throw new Error(responseData?.detail || 'Failed to send the SOS alert.');
      }

      const familyNotificationsCreated = responseData?.family_notifications_created ?? 0;
      setStatusMessage(
        familyNotificationsCreated > 0
          ? 'SOS alert sent. Your linked family member has been notified.'
          : 'SOS alert saved, but no linked family member was found.'
      );
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to send the SOS alert.');
    } finally {
      setIsPressed(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 flex flex-col items-end gap-6 z-50">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4 border border-white/50 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <MapPin className="w-4 h-4 text-emerald-500 animate-bounce" />
          <span>{statusMessage}</span>
        </div>
      </div>

      <button
        onClick={handleSOSClick}
        disabled={isPressed}
        className={`bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-full p-6 shadow-2xl shadow-red-500/30 transition-all duration-300 ${isPressed ? 'scale-95' : 'hover:scale-110'
          } group relative flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-80`}
        aria-label="Emergency SOS"
      >
        <Phone className="w-8 h-8 relative z-10" />
        {/* Ripple effect rings */}
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000"></div>
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000 delay-300"></div>

        <span className="absolute right-[calc(100%+1.5rem)] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-xl">
          Emergency SOS
        </span>
      </button>
    </div>
  );
}

export default SOSButton;
