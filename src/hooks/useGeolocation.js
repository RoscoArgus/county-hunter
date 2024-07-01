import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const onSuccess = (position) => {
      if (isMounted) {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
      }
    };

    const onError = (error) => {
      if (isMounted) {
        setLocation({
          latitude: null,
          longitude: null,
          error: error.message,
        });
      }
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

    // Clean up: stop watching position and set mounted flag to false
    return () => {
      isMounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
};

export default useGeolocation;