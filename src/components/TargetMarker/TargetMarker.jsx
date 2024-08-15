// TargetMarker.jsx
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const TargetMarker = ({ position, children }) => {
  // Define the SVG icon
  const targetIcon = L.divIcon({
    className: '', // No additional classes needed for the SVG
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="30" height="40">
        <path fill="#ef4748" d="M30,15c0,8.28-15,25-15,25,0,0-15-16.72-15-25S6.72,0,15,0s15,6.72,15,15Z"/>
        <circle fill="#fff" cx="15" cy="15" r="10"/>
        <circle fill="#ef4748" cx="15" cy="15" r="5"/>
      </svg>`,
    iconSize: [30, 40], // Size of the SVG icon
    iconAnchor: [15, 40], // Anchor point to align the icon properly
    popupAnchor: [0, -30], // Adjust popup position (above the icon)
  });

  if (!position) return null;
  return (
  <Marker position={position} icon={targetIcon}>
    {children}
  </Marker>
  );
};

export default TargetMarker;
