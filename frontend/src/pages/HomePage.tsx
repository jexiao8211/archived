import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // User is logged in, redirect to profile
      navigate('/profile');
    } else {
      // User is not logged in, redirect to login
      navigate('/login');
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return <div>Loading...</div>;
};

export default HomePage; 