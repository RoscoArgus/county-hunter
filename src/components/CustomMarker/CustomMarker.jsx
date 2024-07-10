// CustomMarker.js
import React from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './CustomMarker.module.css'; // Import the CSS module
import { getImageUrl } from '../../utils/image';

const CustomMarker = ({ position, profileUrl }) => {
  const map = useMap();

  const icon = L.divIcon({
    className: styles.customDivIcon, // Use the CSS module class
    html: `<div class="${styles.circleMarker}"> 
             <img src="${profileUrl ? profileUrl : getImageUrl('user/default.png')}" class="${styles.profilePicture}" alt="profile" />
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  return <Marker position={position} icon={icon} />;
};

export default CustomMarker;
