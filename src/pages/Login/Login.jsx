import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { error, currentUser, handleLoginWithEmailAndPassword, handleLoginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if(currentUser && !error) {
      navigate('/');
    }
  }, [currentUser])

  const handleLogin = async (provider) => {
    const credential = await provider(email, password);
    console.log(credential);
    if(credential)
        navigate('/');
  }

  return (
    <main className={styles.Login}>
      <h2>Welcome to</h2>
      <img src='/county_hunter.svg' alt='logo' className={styles.logo}/>
      <h2>Login</h2>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <div className={styles.passwordContainer}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={styles.input}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={styles.showButton}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <div className={styles.error}>{error}</div>
      <div className={styles.buttons}>
        <div className={styles.or}>
          <button 
            onClick={() => handleLogin(handleLoginWithEmailAndPassword)} 
            className={styles.loginButton}
          >
            Login
          </button>
          or
          <button onClick={() => navigate('/signup')} className={styles.signupButton}>
            Sign Up
          </button>
        </div>
        <button onClick={() => handleLogin(handleLoginWithGoogle)} className={styles.googleButton}>
          <img src='/google.svg' className={styles.googleIcon} />Continue with Google
        </button>
      </div>
    </main>
  );
};

export default Login;