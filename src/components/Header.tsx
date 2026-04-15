import { Bell, User, Heart, Sun, Moon, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  role: string;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

function Header({ role, onNotificationsClick, onProfileClick }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setNotificationCount(0);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const data = await response.json();

        if (isMounted) {
          setNotificationCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        if (isMounted) {
          setNotificationCount(0);
        }
      }
    };

    const syncNotifications = () => {
      fetchNotifications();
    };

    fetchNotifications();
    window.addEventListener('focus', syncNotifications);
    window.addEventListener('notifications-updated', syncNotifications);
    const intervalId = window.setInterval(fetchNotifications, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', syncNotifications);
      window.removeEventListener('notifications-updated', syncNotifications);
      window.clearInterval(intervalId);
    };
  }, [role]);

  const getNavLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'My Patients', path: '/patients' },
          { name: 'Appointments', path: '/appointments' },
        ];
      case 'family':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Patient Overview', path: '/medical-details' },
          { name: 'Care Team', path: '/doctors' },
        ];
      default:
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Medical Details', path: '/medical-details' },
          { name: 'My Appointments', path: '/appointments' },
        ];
    }
  };

  const navLinks = getNavLinks();
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to={role ? '/dashboard' : '/'} className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-2xl">ElderSafe</h1>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white md:hidden"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={onNotificationsClick}
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            <button
              onClick={onProfileClick}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Profile"
            >
              <User className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-200 py-3 dark:border-slate-800 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="rounded-xl px-3 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
