import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, fetchUserProfile, registerUser } from '../api';
import type { UserProfile } from '../api';

interface AuthContextType {
    token: string | null;
    refreshToken: string | null;
    user: UserProfile | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
    const [user, setUser] = useState<UserProfile | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            const getUser = async () => {
                try {
                    const user = await fetchUserProfile(token);
                    setUser(user);
                } catch (error) {
                    // If token is invalid, clear it
                    console.log('Invalid token, clearing...');
                    clearTokens();
                    setUser(null);
                    navigate('/logged-out');
                }
            };
            getUser();
        }
    }, [token]);

    const saveTokens = (access: string, refresh: string) => {
        setToken(access);
        setRefreshToken(refresh);
        localStorage.setItem('token', access);
        localStorage.setItem('refresh_token', refresh);
    };

    const clearTokens = () => {
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    };

    const login = async (username: string, password: string) => {
        const response = await loginUser({ username, password });
        const access = response?.access_token;
        const refresh = (response as any)?.refresh_token || '';
        if (access) {
            saveTokens(access, refresh);
            const userProfile = await fetchUserProfile(access);
            setUser(userProfile);
            navigate('/profile');
        }
    };

    const register = async (username: string, email: string, password: string) => {
        await registerUser({ username, email, password });
        navigate('/login');
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        navigate('/logged-out');
    };

    return (
        <AuthContext.Provider value={{ token, refreshToken, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthProvider, AuthContext };