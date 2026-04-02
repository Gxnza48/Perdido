import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation([position.coords.latitude, position.coords.longitude]);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(error.message);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error };
};
