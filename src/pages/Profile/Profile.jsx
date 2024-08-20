import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Import updateProfile from Firebase Auth
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/image'; // Helper function to crop image
import styles from './Profile.module.css';
import { getColorFromName } from '../../utils/user';
import { FaHome, FaSync, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [pfp, setPfp] = useState(null);
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const { currentUser, handleUpdateProfile, handleDeleteProfile, handleResetPassword } = useAuth();

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // File input reference
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            setUsername(currentUser.displayName);
            setEmail(currentUser.email);
            setPfp(currentUser.photoURL);
            setIsGoogleUser(currentUser.providerData[0].providerId === 'google.com');
        }
    }, [currentUser]);

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadCroppedImage = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 480);
            const imageRef = ref(storage, `users/${currentUser.uid}/profile_picture.jpg`);
            await uploadBytes(imageRef, croppedImageBlob);
            const photoURL = await getDownloadURL(imageRef);

            // Update Firestore with the new photoURL
            await updateDoc(doc(db, 'users', currentUser.uid), { photoURL });

            // Update user profile photoURL in auth using updateProfile method
            await updateProfile(currentUser, { photoURL });
            setImageSrc(null);

            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading image: ', error);
            alert('Failed to upload image');
        }
    };

    const handleFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = null;  // Reset the input value
            fileInputRef.current.click();  // Trigger the file input click
        }
    };

    const handleRemove = () => {
        const confirmed = window.confirm('Are you sure you want to remove your profile picture?');
        if(!confirmed) return;

        updateDoc(doc(db, 'users', currentUser.uid), { photoURL: null });
        updateProfile(currentUser, { photoURL: null });
        setPfp(null);

        alert('Profile picture removed successfully!');
    }

    const handleUpdate = async (event) => {
        event.preventDefault();
        try {
            await handleUpdateProfile(username, email, pfp);
            alert('Profile updated successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    return (
        <div className={styles.Profile} style={{background: `rgb(0, 0, 0, ${imageSrc ? 0.7 : 0})`}}>
            { imageSrc
                ? 
                <div className={styles.cropperContainer}>
                    {/* Buttons at top left and top right */}
                    <button 
                        className={styles.topLeftButton}
                        onClick={() => setImageSrc(null)}  // Cancel button to exit cropper
                    >
                        Cancel
                    </button>
                    <button 
                        className={styles.topRightButton}
                        onClick={uploadCroppedImage}  // Save button to upload the cropped image
                    >
                        Save
                    </button>
                    {/* Cropper Component */}
                    <Cropper
                        style={{ background: 'transparent'}}
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                : 
                <form>
                    <button onClick={() => navigate('/')} className={styles.homeButton}>
                        <FaHome className={styles.icon}/>
                        <h2>Home</h2>
                    </button>
                    <h1>Profile</h1>
                    <div className={styles.section}>
                        { pfp
                            ? <img src={currentUser.photoURL} alt="user" className={styles.pfp} />
                            : <div className={styles.pfp} style={{backgroundColor: getColorFromName(currentUser.displayName)}}>
                                {currentUser.displayName.charAt(0).toUpperCase()}
                            </div>
                        }
                        { !isGoogleUser &&
                            <>
                                <div className={styles.upload} onClick={handleFile}>
                                    Upload Photo
                                </div>
                                <div className={styles.remove} onClick={handleRemove}>
                                    Remove Current Photo
                                </div>
                            </>
                        }
                        {/* Hidden file input */}
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Username */}
                    <div className={styles.section}>
                        <div className={`${styles.sectionLabel} ${styles.username}`}>Username</div>
                        <input
                            id='username'
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            maxLength={50}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <hr />

                    {/* Email */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>Email</div>
                        <input
                            id='email'
                            type="text"
                            placeholder="Enter email"
                            value={email}
                            maxLength={50}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={true}
                        />
                    </div>
                    <hr />

                    {/* Password */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>Password</div>
                        <div className={styles.remove} onClick={handleResetPassword}>
                            Send Password Reset Email
                        </div>
                    </div>
                    <hr />

                    {/* Buttons */}
                    <div className={styles.section}>
                        <button onClick={handleUpdate} className={styles.constructive}>
                            <FaSync className={styles.icon}/>
                            <h2>Update Profile</h2>
                        </button>
                        <button onClick={handleDeleteProfile} className={styles.destructive}>
                            <FaTrash className={styles.icon}/>
                            <h2>Delete Profile</h2>
                        </button>
                    </div>
                </form>
            }
        </div>
    )
};

export default Profile;
