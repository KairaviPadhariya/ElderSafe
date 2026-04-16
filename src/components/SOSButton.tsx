import { Phone, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE_URL = 'http://34.233.187.127:8000';

type LocationDetails = {
  label: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
};

function buildAreaLabel(data: {
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}) {
  const primary = data.suburb || data.neighbourhood || data.city || data.town || data.village;
  const secondary = data.county || data.state_district || data.state;

  if (primary && secondary) {
    return `${primary}, ${secondary}`;
  }

  return primary || secondary || '';
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode location');
    }

    const data = await response.json();
    const address = (data?.address || {}) as {
      suburb?: string;
      neighbourhood?: string;
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state_district?: string;
      state?: string;
      postcode?: string;
    };

    return buildAreaLabel(address) || data?.display_name || '';
  } catch {
    return '';
  }
}

async function formatLocationDetails(position: GeolocationPosition): Promise<LocationDetails> {
  const { latitude, longitude, accuracy } = position.coords;
  const areaName = await reverseGeocode(latitude, longitude);

  return {
    label: areaName || 'Exact area unavailable',
    latitude,
    longitude,
    accuracy,
  };
}

function getCurrentLocation(): Promise<LocationDetails> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ label: 'Location unavailable' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        formatLocationDetails(position).then(resolve);
      },
      () => {
        resolve({ label: 'Location unavailable' });
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
  const [statusMessage, setStatusMessage] = useState('Fetching your location...');
  const [currentLocation, setCurrentLocation] = useState<LocationDetails | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatusMessage('Location unavailable on this device');
      return;
    }

    const updateLocation = async (position: GeolocationPosition) => {
      const location = await formatLocationDetails(position);
      setCurrentLocation(location);
      setStatusMessage(location.label);
    };

    const handleError = () => {
      setCurrentLocation(null);
      setStatusMessage('Allow location access to share your exact location');
    };

    navigator.geolocation.getCurrentPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

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
      setCurrentLocation(location);
      const response = await fetch(`${API_BASE_URL}/sos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: location.label,
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
          ? `SOS alert sent with location: ${location.label}`
          : `SOS alert saved with location: ${location.label}`
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
        <div className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 max-w-[320px]">
          <MapPin className="w-4 h-4 text-emerald-500 animate-bounce mt-0.5 shrink-0" />
          <div>
            <div>{statusMessage}</div>
            {currentLocation?.latitude !== undefined && currentLocation?.longitude !== undefined && (
              <a
                href={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Open in Maps
              </a>
            )}
          </div>
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
