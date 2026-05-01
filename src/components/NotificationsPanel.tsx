import { X, Bell, Calendar, Pill, AlertCircle, User, FileText, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type?: string;
  priority?: string;
}

const API_BASE_URL = "http://100.50.8.161:8000";

function NotificationsPanel({ isOpen, onClose, role }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No token found. Please log in again.');
        setNotifications([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          setError('Unauthorized. Token may be invalid or expired.');
          setNotifications([]);
          return;
        }

        if (!response.ok) {
          setError(`Error: ${response.statusText}`);
          setNotifications([]);
          return;
        }

        const data = await response.json();
        setError(null);
        const nextNotifications = Array.isArray(data) ? data : [];
        setNotifications(nextNotifications);
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications.');
        setNotifications([]);
      }
    };

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-700 dark:text-slate-200" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {error && (
                <p className="text-red-500 text-center">{error}</p>
              )}

              {notifications.length === 0 && !error && (
                <p className="text-gray-500 dark:text-slate-400 text-center">
                  No notifications available
                </p>
              )}

              {notifications.map((notification) => {
                let Icon = Bell;
                if (notification.type === 'appointment') Icon = Calendar;
                else if (notification.type === 'medication') Icon = Pill;
                else if (notification.type === 'alert') Icon = AlertCircle;
                else if (notification.type === 'user') Icon = User;
                else if (notification.type === 'report') Icon = FileText;
                else if (notification.type === 'message') Icon = Mail;

                const accentClass =
                  notification.priority === 'high'
                    ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
                    : 'border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900';

                return (
                  <div
                    key={notification.id}
                    className={`rounded-xl p-4 hover:shadow-md transition-shadow border ${accentClass}`}
                  >
                    <div className="flex gap-4">
                      <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded-lg h-fit">
                        <Icon className="w-5 h-5 text-gray-700 dark:text-slate-200" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 dark:text-slate-300 text-sm mb-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationsPanel;
