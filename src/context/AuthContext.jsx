import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, updateProfile, deleteUser, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const setupAuthStateListener = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    setCurrentUser(user);
                    setLoading(false);
                });

                // Cleanup subscription on unmount
                return () => unsubscribe();
            } catch (error) {
                console.error('Error setting persistence:', error);
                setError(error.message);
                setLoading(false); 
            }
        };

        setupAuthStateListener();
    }, []);

    const handleSignUp = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const displayName = email.split('@')[0].toLowerCase();
            await updateProfile(userCredential.user, { displayName: displayName });
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                username: displayName,
                email: email,
                photoURL: null
            });
            console.log('User signed up successfully!');
            return userCredential;
        } catch (error) {
            setError(error.message);
            console.error('Error signing up:', error);
        }
    };

    const handleLoginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
    
            // Check if the account is newly created and make their display name lowercase
            if (user.metadata.creationTime === user.metadata.lastSignInTime) {
                const displayName = user.displayName.toLowerCase();
                await updateProfile(user, { displayName });
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    username: displayName,
                    email: user.email,
                    photoURL: null
                });
                console.log('New user signed in with Google and display name updated to lowercase.');
            } else {
                console.log('Existing user signed in with Google');
            }
    
            return userCredential;
        } catch (error) {
            setError(error.message);
            console.error('Error signing in with Google:', error);
        }
    };

    const handleLoginWithEmailAndPassword = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User signed in:', userCredential.user);
            return userCredential;
        } catch (error) {
            let message;
            switch(error.code) {
                case 'auth/user-not-found':
                    message = 'User not found';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email';
                    break;
                case 'auth/invalid-credential':
                    message = 'Incorrect email or password';
                    break;
                case 'auth/missing-password':
                    message = 'Password is required';
                    break;
                case 'auth/popup-closed-by-user':
                    message = 'There was an error signing in with Google';
                    break;
                default:
                    message = error.message;
            }
            setError(message);
            console.error('Error signing in:', error);
        }
    };

    const handleUpdateProfile = async (name, email) => {
        try {
            await updateProfile(currentUser, {
                displayName: name,
                email: email,
            });
            alert('Profile updated successfully!');
        } catch (error) {

        }
    };

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            alert('Password reset email sent!');
        } catch (error) {
            setError(error.message);
            console.error('Error sending password reset email:', error);
        }
    }

    return (
        <AuthContext.Provider value={{ currentUser, loading, error, handleSignUp, handleLoginWithGoogle, handleLoginWithEmailAndPassword, handleUpdateProfile, handleResetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};