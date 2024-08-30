import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from './SignUp.module.css';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { error, handleSignUp, handleLoginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (provider) => {
        const credential = await provider(email, username, password, confirmPassword);
        if(credential)
            navigate('/');
    }

    const handleTextChange = (e, setter) => {
        const newValue = e.target.value.replace(/\s+/g, '_');
        setter(newValue);
    }

    return (
        <main className={styles.Login}>
          <h2>Welcome to</h2>
          <img src='/county_hunter.svg' alt='logo' className={styles.logo}/>
          <h3>Sign Up</h3>
            <input
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleTextChange(e, setEmail)}
                style={{ border:  error.toLowerCase().includes('email') ? '2px solid red' : '' }}
            />
            <input
                type="text"
                placeholder="Enter your username"
                value={username}
                maxLength={20}
                onChange={(e) => handleTextChange(e, setUsername)}
                style={{ border:  error.toLowerCase().includes('username') ? '2px solid red' : '' }}
            />
            <div className={styles.passwordContainer}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleTextChange(e, setPassword)}
                    placeholder="Enter your password"
                    className={styles.input}
                    style={{ border:  error.toLowerCase().includes('password') ? '2px solid red' : '' }}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.showButton}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
            <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => handleTextChange(e, setConfirmPassword)}
                placeholder="Re-enter your password"
                className={styles.input}
                style={{ border:  error.toLowerCase().includes('password') ? '2px solid red' : '' }}
            />
            <div className={styles.error}>{error}</div>
            <div className={styles.buttons}>
                <button 
                    onClick={() => handleLogin(handleSignUp)} 
                    className={styles.signupButton}
                >
                    <h2>Sign Up</h2>
                </button>
                <button onClick={() => handleLogin(handleLoginWithGoogle)} className={styles.googleButton}>
                    <img src='/google.svg' className={styles.googleIcon} /><h2>Continue with Google</h2>
                </button>
                <p>Already have an account?</p>
                <button onClick={() => navigate('/login')} className={styles.loginButton}>
                    <h2>Login</h2>
                </button>
            </div>
        </main>
      );
};

export default SignUp;