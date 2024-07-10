import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { currentUser, handleSignUp, handleLoginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (provider) => {
        const credential = await provider(email, password);
        if(credential)
            navigate('/');
    }

    return (
        <div>
            <h2>Sign Up</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => handleLogin(handleSignUp)}>Sign Up</button>
        </div>
    );
};

export default SignUp;