import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const { currentUser, handleUpdateProfile, handleResetPassword } = useAuth();

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            setName(currentUser.displayName);
            setEmail(currentUser.email);
            setIsGoogleUser(currentUser.providerData[0].providerId === 'google.com');
        }
    }, []);

    return (
        <div>
            <h1>Profile</h1>
            {user ? (
                <div>
                    <p>Name: {user.displayName}</p>
                    <p>Email: {user.email}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
            <h2>Update Profile</h2>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} />
            <input type="email" disabled={isGoogleUser} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => handleUpdateProfile(name, email)}>Update</button>

            <button style={{display: (isGoogleUser ? 'none' : '')}} onClick={handleResetPassword}>Reset Password</button>
        </div>
    );
};

export default Profile;