import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsername } from '../../context/UsernameContext';

const Login = () => {
  const { setUsername } = useUsername();
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const handleSetUsername = () => {
    if (inputValue.trim()) {
      setUsername(inputValue.trim());
      navigate('/');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter your username"
      />
      <button onClick={handleSetUsername}>Set Username</button>
    </div>
  );
};

export default Login;
