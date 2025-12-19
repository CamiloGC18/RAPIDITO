import { useState, useEffect, useContext, useCallback } from 'react';
import { SocketDataContext } from '../contexts/SocketContext';
import { interpolateCoordinates } from '../utils/mapAnimations';
import { calculateBearing } from '../utils/geolocation';

const useRideTracking = (rideId) => {
  const { socket } = useContext(SocketDataContext);
  
  const [captainLocation, setCaptainLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [pickupETA, setPickupETA] = useState(null);
  const [dropoffETA, setDropoffETA] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('awaiting-captain');
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Interpolate captain location for smooth movement
  const updateCaptainLocation = useCallback((newLocation) => {
    if (!newLocation) return;

    setCaptainLocation(prev => {
      if (!prev) return newLocation;

      // Calculate heading if not provided
      let heading = newLocation.heading;
      if (!heading && prev) {
        heading = calculateBearing(
          { lat: prev.latitude, lng: prev.longitude },
          { lat: newLocation.latitude, lng: newLocation.longitude }
        );
      }

      return {
        lat: newLocation.latitude,
        lng: newLocation.longitude,
        heading: heading || prev.heading || 0,
        speed: newLocation.speed || 0
      };
    });

    setLastUpdate(new Date());
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    if (!socket || !rideId || !isTracking) return;

    console.log('Subscribing to tracking for ride:', rideId);

    // Subscribe to captain tracking
    socket.emit('user:subscribe-captain-tracking', { rideId });

    // Listen for captain location updates
    socket.on('captain:location-updated', (data) => {
      console.log('Captain location updated:', data);
      updateCaptainLocation(data.location);
    });

    // Listen for captain location response
    socket.on('captain:location-response', (data) => {
      console.log('Captain location response:', data);
      updateCaptainLocation(data.location);
    });

    // Listen for ETA updates
    socket.on('ride:eta-updated', (data) => {
      console.log('ETA updated:', data);
      if (data.pickupETA !== undefined) {
        setPickupETA(data.pickupETA);
      }
      if (data.dropoffETA !== undefined) {
        setDropoffETA(data.dropoffETA);
      }
    });

    // Listen for ride status changes
    socket.on('ride:status-changed', (data) => {
      console.log('Ride status changed:', data);
      if (data.phase) {
        setCurrentPhase(data.phase);
      }
    });

    // Listen for tracking started
    socket.on('ride:tracking-started', (data) => {
      console.log('Tracking started:', data);
      setCurrentPhase('captain-arriving');
    });

    // Listen for tracking stopped
    socket.on('ride:tracking-stopped', (data) => {
      console.log('Tracking stopped:', data);
      stopTracking();
    });

    // Cleanup
    return () => {
      socket.off('captain:location-updated');
      socket.off('captain:location-response');
      socket.off('ride:eta-updated');
      socket.off('ride:status-changed');
      socket.off('ride:tracking-started');
      socket.off('ride:tracking-stopped');
    };
  }, [socket, rideId, isTracking, updateCaptainLocation]);

  // Start tracking
  const startTracking = useCallback((initialData = {}) => {
    console.log('Starting tracking for ride:', rideId);
    setIsTracking(true);

    if (initialData.userLocation) {
      setUserLocation(initialData.userLocation);
    }
    if (initialData.captainLocation) {
      updateCaptainLocation(initialData.captainLocation);
    }
    if (initialData.route) {
      setRoute(initialData.route);
    }
    if (initialData.pickupETA) {
      setPickupETA(initialData.pickupETA);
    }
    if (initialData.currentPhase) {
      setCurrentPhase(initialData.currentPhase);
    }

    // Request initial captain location
    if (socket && rideId) {
      socket.emit('user:request-captain-location', { rideId });
    }
  }, [rideId, socket, updateCaptainLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('Stopping tracking for ride:', rideId);
    setIsTracking(false);

    if (socket && rideId) {
      socket.emit('user:unsubscribe-captain-tracking', { rideId });
    }
  }, [rideId, socket]);

  return {
    captainLocation,
    userLocation,
    route,
    pickupETA,
    dropoffETA,
    currentPhase,
    isTracking,
    lastUpdate,
    startTracking,
    stopTracking,
    setUserLocation,
    setRoute,
    setCurrentPhase
  };
};

export default useRideTracking;
