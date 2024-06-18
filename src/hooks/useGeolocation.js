import React, { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    } else {
      console.error("Geolocation not supported");
    }
  }, []);

  return location;
};

export default useGeolocation;