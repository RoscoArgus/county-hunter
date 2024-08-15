// UserMarker.jsx
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import styles from './UserMarker.module.css'; // Import the CSS module
import { getColorFromName } from '../../utils/user';
import { useAuth } from '../../context/AuthContext';

const UserMarker = ({ position, user, children }) => {
  // Get the first letter of the displayName and use it to generate a color
  const { currentUser } = useAuth();
  const displayName = user?.displayName || 'U';
  const backgroundColor = getColorFromName(displayName);

  // Create the icon with dynamic HTML
  const icon = L.divIcon({
    className: styles.customDivIcon, // Use the CSS module class
    html: user?.photoURL
      ? `<div class="${styles.circleMarker} ${currentUser.displayName === displayName ? styles.self : ''}">
           <img src="${user.photoURL}" class="${styles.profilePicture}" alt="profile" />
         </div>`
      : `<div class="${styles.circleMarker}" style="background-color: ${backgroundColor};">
           ${displayName.charAt(0).toUpperCase()}
         </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  if(!position) return null;
  return (
    <Marker position={position} icon={icon}>
      {children}
    </Marker>
  )
};

export default UserMarker;