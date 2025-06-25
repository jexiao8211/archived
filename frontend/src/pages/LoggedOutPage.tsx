import { useNavigate } from 'react-router-dom';

const LoggedOutPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
      <h2>You have been logged out</h2>
      <p>Your session has expired or you have been logged out. Please log in again to continue.</p>
      <button onClick={() => navigate('/login')}>Go to Login</button>
    </div>
  );
};

export default LoggedOutPage; 