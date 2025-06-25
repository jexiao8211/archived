import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import type { UserProfile } from '../api';

const UserProfilePage: React.FC = () => {
    const { user, logout } = useContext(AuthContext) as {
        user: UserProfile | null;
        logout: () => void;
    };
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/logged-out');
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    return (
        <div>
            <h2>User Profile</h2>
            <p>Username: {user.username}</p>
            <p>Email: {user.email}</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

export default UserProfilePage; 