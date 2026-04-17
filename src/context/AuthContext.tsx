import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type AuthUser = {
    name: string;
    email: string;
    id: string;
};

type AuthRole = 'senior' | 'family' | 'doctor';

type AuthContextValue = {
    user: AuthUser | null;
    role: AuthRole | null;
    login: (userData: AuthUser, userRole: AuthRole) => void;
    logout: () => void;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [role, setRole] = useState<AuthRole | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('role');

        if (storedUser && storedRole) {
            setUser(JSON.parse(storedUser));
            setRole(storedRole as AuthRole);
        }
        setLoading(false);
    }, []);

    const login = (userData: AuthUser, userRole: AuthRole) => {
        setUser(userData);
        setRole(userRole);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userRole);

        // Redirect based on role
        if (userRole === 'doctor') {
            navigate('/doctor-dashboard');
        } else if (userRole === 'family') {
            navigate('/family-dashboard');
        } else {
            navigate('/'); // Senior dashboard
        }
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, role, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider.');
    }

    return context;
};
