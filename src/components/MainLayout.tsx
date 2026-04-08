import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import NotificationsPanel from './NotificationsPanel';
import ProfilePanel from './ProfilePanel';

const MainLayout = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const role = localStorage.getItem('userRole') || 'patient';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Header
                role={role}
                onNotificationsClick={() => setShowNotifications(true)}
                onProfileClick={() => setShowProfile(true)}
            />

            {/* Main Content Area */}
            <Outlet />

            <NotificationsPanel
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                role={role}
            />

            <ProfilePanel
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                role={role}
            />
        </div>
    );
};

export default MainLayout;
