// src/UserProfile.jsx
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import type { UserProfile } from '../api';

const UserProfilePage: React.FC = () => {
    const { user, logout } = useContext(AuthContext) as {
        user: UserProfile | null;
        logout: () => void;
    };

    if (!user) {
        return <div>Loading...</div>;
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