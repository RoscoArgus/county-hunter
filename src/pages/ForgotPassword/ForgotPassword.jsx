import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ForgotPassword.module.css';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { preloadImage } from '../../utils/image';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const { error, currentUser, handleForgotPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      await handleForgotPassword(email);
      setIsSubmitted(true);
    }
  };

  const handleTextChange = (e) => {
    const newValue = e.target.value.trim().replace(/\s+/g, '');
    setEmail(newValue);
  };

  useEffect(() => {
    const images = ['/county_hunter.svg'];
    const promises = images.map((src) => preloadImage(src));
    Promise.all(promises).then(() => setImagesLoading(false));
  }, []);

  if (imagesLoading) {
    return <LoadingScreen />;
  }

  if (isSubmitted) {
    return (
      <main className={styles.ForgotPassword}>
        <h2>Welcome to</h2>
        <img src='/county_hunter.svg' alt='logo' className={styles.logo} />
        <h3>Check Your Email</h3>
        <p className={styles.successMessage}>
          If an account with the email <strong>{email}</strong> exists, 
          we've sent you a password reset link.
        </p>
        <p className={styles.helpText}>
          Check your spam folder if you don't see the email in your inbox.
        </p>
        <div className={styles.buttons}>
          <button 
            onClick={() => navigate('/login')} 
            className={styles.backButton}
          >
            <h2>Back to Login</h2>
          </button>
          <button 
            onClick={() => {
              setIsSubmitted(false);
              setEmail('');
            }} 
            className={styles.resendButton}
          >
            <h2>Send Another Email</h2>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.ForgotPassword}>
      <h2>Welcome to</h2>
      <img src='/county_hunter.svg' alt='logo' className={styles.logo} />
      <h3>Reset Password</h3>
      <p className={styles.description}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          value={email}
          onChange={handleTextChange}
          placeholder="Enter your email"
          required
        />
        <div className={styles.error}>{error}</div>
        <div className={styles.buttons}>
          <button 
            type="submit" 
            className={styles.resetButton}
            disabled={!email.trim()}
          >
            <h2>Send Reset Email</h2>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/login')} 
            className={styles.backButton}
          >
            <h2>Back to Login</h2>
          </button>
        </div>
      </form>
    </main>
  );
};

export default ForgotPassword;
