// CustomMarker.js
import React from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './CustomMarker.module.css'; // Import the CSS module

const getColorFromName = (name) => {
  // Generate a hash from the name and convert it to a color
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = `hsl(${hash % 360}, 100%, 80%)`;
  return color;
};

const CustomMarker = ({ position, user }) => {
  const map = useMap();

  // Get the first letter of the displayName and use it to generate a color
  const displayName = user?.displayName || 'U';
  const backgroundColor = getColorFromName(displayName);

  // Create the icon with dynamic HTML
  const icon = L.divIcon({
    className: styles.customDivIcon, // Use the CSS module class
    html: user?.photoURL
      ? `<div class="${styles.circleMarker}">
           <img src="${user.photoURL}" class="${styles.profilePicture}" alt="profile" />
         </div>`
      : `<div class="${styles.circleMarker}" style="background-color: ${backgroundColor};">
           ${displayName.charAt(0).toUpperCase()}
         </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return <Marker position={position} icon={icon} />;
};

export default CustomMarker;