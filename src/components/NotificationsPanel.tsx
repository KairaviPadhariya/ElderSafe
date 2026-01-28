import { X, Bell, Calendar, Pill, AlertCircle } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const notifications = [
    {
      id: 1,
      type: 'appointment',
      icon: Calendar,
      title: 'Upcoming Appointment',
      message: 'Cardiology appointment tomorrow at 10:00 AM',
      time: '1 hour ago',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
    {
      id: 2,
      type: 'medication',
      icon: Pill,
      title: 'Medication Reminder',
      message: 'Time to take your evening medication',
      time: '2 hours ago',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      id: 3,
      type: 'alert',
      icon: AlertCircle,
      title: 'Health Alert',
      message: 'Your blood pressure reading was slightly elevated',
      time: '5 hours ago',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

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
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      <div className={`${notification.bgColor} p-2 rounded-lg h-fit`}>
                        <Icon className={`w-5 h-5 ${notification.color}`} />
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
