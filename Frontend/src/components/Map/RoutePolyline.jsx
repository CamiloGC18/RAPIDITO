import { useEffect, useState } from 'react';
import { Polyline } from '@react-google-maps/api';
import { animatePolyline } from '../../utils/mapAnimations';

const RoutePolyline = ({ 
  path = [], 
  phase = 'captain-arriving',
  animate = false 
}) => {
  const [polyline, setPolyline] = useState(null);
  const [animatedPath, setAnimatedPath] = useState([]);

  // Color based on phase
  const colors = {
    'captain-arriving': '#4285F4', // Blue - captain going to pickup
    'in-progress': '#34A853',      // Green - heading to destination
    'completed': '#9E9E9E'         // Gray - completed
  };

  const polylineOptions = {
    strokeColor: colors[phase] || colors['captain-arriving'],
    strokeOpacity: 0.9,
    strokeWeight: 5,
    geodesic: true,
    clickable: false
  };

  useEffect(() => {
    if (polyline && path && path.length > 0 && animate) {
      animatePolyline(polyline, path, 1000);
    } else if (path && path.length > 0) {
      setAnimatedPath(path);
    }
  }, [polyline, path, animate]);

  if (!path || path.length === 0) {
    return null;
  }

  return (
    <Polyline
      path={animate ? animatedPath : path}
      options={polylineOptions}
      onLoad={setPolyline}
    />
  );
};

export default RoutePolyline;
