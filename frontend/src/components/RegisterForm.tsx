import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import styles from '../styles/components/LoginAndRegister.module.css';

const RegisterForm = () => {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');

  // Check if passwords match and both are filled
  const passwordsMatch = password === password2 && password.length > 0;
  const canSubmit = username.length > 0 && email.length > 0 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check that both password inputs match
    if (password !== password2) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    // Check password length (optional - you can adjust minimum length)
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await register(username, email, password);
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Register</h2>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles.input}
            minLength={6}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Confirm Password:</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
            className={styles.input}
            minLength={6}
          />
          {password2.length > 0 && (
            <div className={`${styles.passwordMatch} ${passwordsMatch ? styles.match : styles.noMatch}`}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className={styles.button}
          disabled={!canSubmit}
        >
          Register
        </button>
        {error && <div className={styles.error}>{error}</div>}
      </form>
      <div className={styles.linkContainer}>
        <Link to="/login" className={styles.link}>
          already have an account? login here
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm; 