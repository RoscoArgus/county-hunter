import { useState, useEffect } from 'react';

export const simulatePlayerMovement = (setLocation) => {
    let latitude = 53.34983; // Initial latitude (e.g., New York City)
    let longitude = -6.26026; // Initial longitude (e.g., New York City)
    let step = 0.0001; // Step size for each update
  
    setInterval(() => {
      latitude += step; // Increment latitude
      longitude += step; // Increment longitude
  
      setLocation({
        latitude,
        longitude,
      });
    }, 1000); // Update location every 1 second
};
  
export const useGeolocation = () => {
    const [location, setLocation] = useState({ latitude: 53.34983, longitude: -6.26026 });
  
    /*useEffect(() => {
      simulatePlayerMovement(setLocation);
    }, []);*/
  
    return location;
};