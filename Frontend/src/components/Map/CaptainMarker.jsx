import { useEffect, useState } from 'react';
import { Marker } from '@react-google-maps/api';
import { smoothMarkerTransition, rotateMarker } from '../../utils/mapAnimations';

const vehicleIcons = {
  car: '🚗',
  bike: '🏍️',
  auto: '🛺'
};

const CaptainMarker = ({ 
  position, 
  heading = 0, 
  speed = 0,
  vehicleType = 'car',
  isMoving = false 
}) => {
  const [marker, setMarker] = useState(null);
  const [prevPosition, setPrevPosition] = useState(position);

  useEffect(() => {
    if (marker && position) {
      // Calculate if position changed significantly (more than 10 meters)
      const hasMoved = prevPosition && (
        Math.abs(position.lat - prevPosition.lat) > 0.0001 ||
        Math.abs(position.lng - prevPosition.lng) > 0.0001
      );

      if (hasMoved) {
        smoothMarkerTransition(marker, position, 500);
        setPrevPosition(position);
      }
    }
  }, [marker, position, prevPosition]);

  useEffect(() => {
    if (marker && heading !== undefined && heading !== null) {
      rotateMarker(marker, heading, 300);
    }
  }, [marker, heading]);

  const icon = {
    path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 0,
    scale: 6,
    fillColor: isMoving ? '#4CAF50' : '#FFA726',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    rotation: heading || 0
  };

  return (
    <Marker
      position={position}
      icon={icon}
      onLoad={setMarker}
      title={`Conductor (${vehicleType})`}
      zIndex={1000}
    />
  );
};

export default CaptainMarker;
