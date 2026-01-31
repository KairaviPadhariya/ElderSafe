import { Bell, User, Heart, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  role: string;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
}

function Header({ role, onNotificationsClick, onProfileClick }: HeaderProps) {
  const notificationCount = 3;
  const { theme, toggleTheme } = useTheme();

  const getNavLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { name: 'Dashboard', path: '/' },
          { name: 'Patients', path: '/patients' }, // Placeholder path
          { name: 'Appointments', path: '/appointments' },
          { name: 'Reports', path: '/reports' }, // Placeholder path
        ];
      case 'family':
        return [
          { name: 'Dashboard', path: '/' },
          { name: 'Patient Overview', path: '/medical-details' }, // Reuse medical details?
          { name: 'Reports', path: '/reports' }, // Placeholder
        ];
      default: // patient
        return [
          { name: 'Dashboard', path: '/' },
          { name: 'Medical Details', path: '/medical-details' },
          { name: 'My Doctors', path: '/doctors' },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ElderSafe</h1>
            </Link>
          </div>

          {/* Navigation Links */}
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
                <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                  {notificationCount}
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
      </div>
    </header>
  );
}

export default Header;
