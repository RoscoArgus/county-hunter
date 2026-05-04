import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import { preloadImage } from '../../utils/image';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const { error, currentUser, handleLoginWithEmailAndPassword, handleLoginWithGoogle, handleResetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if(currentUser && !error) {
      navigate('/');
    }
  }, [currentUser])

  const handleLogin = async (provider) => {
    const credential = await provider(email, password);
    if(credential)
        navigate('/');
  }

  const handleTextChange = (e, setter) => {
    const newValue = e.target.value.trim().replace(/\s+/g, '');
    setter(newValue);
  }

  useEffect(() => {  
    const images = ['/county_hunter.svg'];
    const promises = images.map((src) => preloadImage(src));
    Promise.all(promises).then(() => setImagesLoading(false));
  }, []);

  if(imagesLoading) {
    return <LoadingScreen />;
  }
  return (
    <main className={styles.Login}>
      <h2>Welcome to</h2>
      <img src='/county_hunter.svg' alt='logo' className={styles.logo}/>
      <h3>Login</h3>
      <input
        type="text"
        value={email}
        onChange={(e) => handleTextChange(e, setEmail)}
        placeholder="Enter your email"
      />
      <div className={styles.passwordContainer}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => handleTextChange(e, setPassword)}
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
      <div className={styles.forgotPassword}>
        <a href="/forgot-password" className={styles.forgotButton}>
          Forgot Password?
        </a>
      </div>
      <div className={styles.error}>{error}</div>
      <div className={styles.buttons}>
        <div className={styles.or}>
          <button 
            onClick={() => handleLogin(handleLoginWithEmailAndPassword)} 
            className={styles.loginButton}
          >
            <h2>Login</h2>
          </button>
          or
          <button onClick={() => navigate('/signup')} className={styles.signupButton}>
            <h2>Sign Up</h2>
          </button>
        </div>
        <button onClick={() => handleLogin(handleLoginWithGoogle)} className={styles.googleButton}>
          <img src='/google.svg' className={styles.googleIcon} />
          <h2>Continue with Google</h2>
        </button>
      </div>
    </main>
  );
};

export default Login;