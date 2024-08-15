import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <h1 className={styles.title}>County Hunter</h1>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />
      <br/>
      <button onClick={() => handleLogin(handleLoginWithEmailAndPassword)}>Login</button>
      <br/> or
      <button onClick={() => navigate('/signup')}>Sign Up</button>

      <button onClick={() => handleLogin(handleLoginWithGoogle)}>Login with Google</button>
      <div>{error}</div>
    </main>
  );
};

export default Login;