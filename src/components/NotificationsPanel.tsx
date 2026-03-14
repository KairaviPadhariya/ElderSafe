import { X, Bell, Calendar, Pill, AlertCircle, User, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type?: string;
}

function NotificationsPanel({ isOpen, onClose, role }: NotificationsPanelProps) {

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {

    const fetchNotifications = async () => {

      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://127.0.0.1:8000/notifications", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();
        setNotifications(data);

      } catch (error) {
        console.error("Error fetching notifications:", error);
      }

    };

    if (isOpen) {
      fetchNotifications();
    }

  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        <div className="h-full flex flex-col">

          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">

              {notifications.length === 0 && (
                <p className="text-gray-500 text-center">
                  No notifications available
                </p>
              )}

              {notifications.map((notification) => {

                let Icon = Bell;

                if (notification.type === "appointment") Icon = Calendar;
                else if (notification.type === "medication") Icon = Pill;
                else if (notification.type === "alert") Icon = AlertCircle;
                else if (notification.type === "user") Icon = User;
                else if (notification.type === "report") Icon = FileText;

                return (
                  <div
                    key={notification.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">

                      <div className="bg-gray-100 p-2 rounded-lg h-fit">
                        <Icon className="w-5 h-5 text-gray-700" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {notification.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>

                        <span className="text-xs text-gray-500">
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