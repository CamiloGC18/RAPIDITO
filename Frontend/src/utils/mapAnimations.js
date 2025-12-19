/**
 * Smooth marker transition using requestAnimationFrame
 * @param {object} marker - Google Maps marker instance
 * @param {object} newPosition - { lat, lng }
 * @param {number} duration - Animation duration in ms
 */
export const smoothMarkerTransition = (marker, newPosition, duration = 500) => {
  if (!marker || !newPosition) return;

  const start = marker.getPosition();
  if (!start) return;

  const startLat = start.lat();
  const startLng = start.lng();
  const endLat = newPosition.lat;
  const endLng = newPosition.lng;
  
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    
    const currentLat = startLat + (endLat - startLat) * eased;
    const currentLng = startLng + (endLng - startLng) * eased;
    
    marker.setPosition({ lat: currentLat, lng: currentLng });
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Animate polyline drawing
 * @param {object} polyline - Google Maps polyline instance
 * @param {array} coordinates - Array of { lat, lng }
 * @param {number} duration - Animation duration in ms
 */
export const animatePolyline = (polyline, coordinates, duration = 1000) => {
  if (!polyline || !coordinates || coordinates.length === 0) return;

  const totalPoints = coordinates.length;
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const pointsToShow = Math.floor(totalPoints * progress);
    const visiblePath = coordinates.slice(0, pointsToShow);
    
    polyline.setPath(visiblePath);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Rotate marker to heading
 * @param {object} marker - Google Maps marker instance
 * @param {number} heading - Heading in degrees
 * @param {number} duration - Animation duration in ms
 */
export const rotateMarker = (marker, heading, duration = 300) => {
  if (!marker || typeof heading !== 'number') return;

  const icon = marker.getIcon();
  if (!icon) return;

  const startRotation = icon.rotation || 0;
  const endRotation = heading;
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    
    const currentRotation = startRotation + (endRotation - startRotation) * eased;
    
    const newIcon = { ...icon, rotation: currentRotation };
    marker.setIcon(newIcon);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Interpolate coordinates
 * @param {object} start - { lat, lng }
 * @param {object} end - { lat, lng }
 * @param {number} progress - Progress from 0 to 1
 * @returns {object} Interpolated { lat, lng }
 */
export const interpolateCoordinates = (start, end, progress) => {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress
  };
};

/**
 * Easing function for smooth animations
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value
 */
export const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Linear interpolation
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} progress - Progress from 0 to 1
 * @returns {number} Interpolated value
 */
export const lerp = (start, end, progress) => {
  return start + (end - start) * progress;
};
