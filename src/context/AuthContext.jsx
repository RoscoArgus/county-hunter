import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, updateProfile, deleteUser, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, getDocs, deleteDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

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

    const handleSignUp = async (email, username, password, confirmPassword) => {
        try {
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match. Please try again.');
            }
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error('Username already exists. Please choose a different username.');
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                username: username,
                email: email,
                photoURL: null
            });
            console.log('User signed up successfully!');
            return userCredential;
        } catch (error) {
            let message;
            switch(error.code) {
                case 'auth/invalid-email':
                    message = 'Invalid email';
                    break;
                case 'auth/missing-password':
                    message = 'Password is required';
                    break;
                case 'auth/popup-closed-by-user':
                    message = 'There was an error signing in with Google';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Email already in use';
                    break;
                default:
                    message = error.message;
            }
            setError(message);
            console.error('Error signing in:', error);
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
            if(error.code === 'auth/popup-closed-by-user') {
                setError(error.message);
            }
            console.error('Error signing in with Google:', error);
        }
    };

    const handleLoginWithEmailAndPassword = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User signed in successfully!');
            return userCredential;
        } catch (error) {
            let message;
            console.log(error);
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

    const handleUpdateProfile = async (username, email, photoURL) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error('Username already exists. Please choose a different username.');
            }
            await updateProfile(currentUser, {
                displayName: username,
                email: email,
                photoURL: photoURL,
            });
            await updateDoc(doc(db, 'users', currentUser.uid), {
                username,
                email,
                photoURL,
            });
            alert('Profile updated successfully!');
            return true;
        } catch (error) {
            setError(error.message);
            alert(error.message);
            console.error('Error updating profile:', error);
            return false;
        }
    };

    const handleDeleteProfile = async () => {
        try {
            const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
            if (!confirmed) return;
            await deleteUser(currentUser);
            // Delete presets with the given user as the creator
            const presetsRef = collection(db, 'presets');
            const q = query(presetsRef, where('creator', '==', currentUser.displayName));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            await deleteDoc(doc(db, 'users', currentUser.uid));
            alert('Account deleted successfully!');
        } catch (error) {
            setError(error.message);
            console.error('Error deleting account:', error);
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
        <AuthContext.Provider value={{ currentUser, loading, error, handleSignUp, handleLoginWithGoogle, handleLoginWithEmailAndPassword, handleUpdateProfile, handleDeleteProfile, handleResetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};