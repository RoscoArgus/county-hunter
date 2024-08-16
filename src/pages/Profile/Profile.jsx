import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // Import updateProfile from Firebase Auth
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/image'; // Helper function to crop image

const Profile = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const { currentUser, handleUpdateProfile, handleResetPassword } = useAuth();

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
            setName(currentUser.displayName);
            setEmail(currentUser.email);
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

            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading image: ', error);
            alert('Failed to upload image');
        }
    };

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
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={() => handleUpdateProfile(name, email)}>Update</button>

            <button style={{ display: isGoogleUser ? 'none' : '' }} onClick={handleResetPassword}>Reset Password</button>

            <h2>Update Profile Picture</h2>
            <input disabled={isGoogleUser} type="file" accept="image/*" onChange={handleImageUpload} />
            {imageSrc && (
                <>
                    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>
                    <button onClick={uploadCroppedImage}>Upload</button>
                </>
            )}
        </div>
    );
};

export default Profile;