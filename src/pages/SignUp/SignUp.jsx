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

    return (
        <main className={styles.Login}>
          <h2>Welcome to</h2>
          <img src='/county_hunter.svg' alt='logo' className={styles.logo}/>
          <h2>Sign Up</h2>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border:  error.toLowerCase().includes('email') ? '2px solid red' : '' }}
            />
            <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ border:  error.toLowerCase().includes('username') ? '2px solid red' : '' }}
            />
            <div className={styles.passwordContainer}>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Sign Up
                </button>
                <button onClick={() => handleLogin(handleLoginWithGoogle)} className={styles.googleButton}>
                    <img src='/google.svg' className={styles.googleIcon} />Continue with Google
                </button>
                <p>Already have an account?</p>
                <button onClick={() => navigate('/login')} className={styles.loginButton}>
                    Login
                </button>
            </div>
        </main>
      );
};

export default SignUp;