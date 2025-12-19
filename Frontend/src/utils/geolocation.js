/**
 * Get current position (Promise-based)
 * @param {object} options - Geolocation options
 * @returns {Promise} Position promise
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    });
  });
};

/**
 * Watch position continuously
 * @param {function} callback - Success callback
 * @param {function} errorCallback - Error callback
 * @param {object} options - Geolocation options
 * @returns {number} Watch ID
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    console.error('Geolocalización no soportada');
    return null;
  }
  
  return navigator.geolocation.watchPosition(
    callback,
    errorCallback || ((error) => console.error('Error de geolocalización:', error)),
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options
    }
  );
};

/**
 * Clear watch position
 * @param {number} watchId - Watch ID to clear
 */
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Calculate bearing between two points
 * @param {object} start - { lat, lng }
 * @param {object} end - { lat, lng }
 * @returns {number} Bearing in degrees
 */
export const calculateBearing = (start, end) => {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);
  
  const startLat = toRadians(start.lat);
  const startLng = toRadians(start.lng);
  const endLat = toRadians(end.lat);
  const endLng = toRadians(end.lng);
  
  const dLng = endLng - startLng;
  
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
            Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  
  const bearing = toDegrees(Math.atan2(y, x));
  
  return (bearing + 360) % 360;
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Valid or not
 */
export const isValidCoordinate = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  if (!meters || isNaN(meters)) return '0 m';
  
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  return `${secs}s`;
};

/**
 * Format ETA for display
 * @param {number} minutes - ETA in minutes
 * @returns {string} Formatted ETA
 */
export const formatETA = (minutes) => {
  if (!minutes || isNaN(minutes) || minutes < 0) return '0 min';
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (mins > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${hours}h`;
};

/**
 * Calculate distance between two points (Haversine formula)
 * @param {object} point1 - { lat, lng }
 * @param {object} point2 - { lat, lng }
 * @returns {number} Distance in meters
 */
export const calculateDistance = (point1, point2) => {
  const toRadians = (deg) => deg * (Math.PI / 180);
  
  const R = 6371000; // Earth's radius in meters
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Handle geolocation errors
 * @param {object} error - Geolocation error
 * @returns {string} User-friendly error message
 */
export const getGeolocationErrorMessage = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permisos de ubicación denegados. Por favor habilita los permisos de ubicación.';
    case error.POSITION_UNAVAILABLE:
      return 'Ubicación no disponible. Por favor intenta de nuevo.';
    case error.TIMEOUT:
      return 'Tiempo de espera agotado. Por favor intenta de nuevo.';
    default:
      return 'Error al obtener la ubicación. Por favor intenta de nuevo.';
  }
};
