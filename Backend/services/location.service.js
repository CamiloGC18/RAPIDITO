const NodeCache = require('node-cache');
const { getDistance, computeDestinationPoint, getRhumbLineBearing } = require('geolib');
const captainModel = require('../models/captain.model');

// Initialize cache with TTL
const locationCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
const nearbyCache = new NodeCache({ stdTTL: 10, checkperiod: 5 });

/**
 * Update captain location with validation
 * @param {string} captainId - Captain's ID
 * @param {object} coordinates - Location data { latitude, longitude, accuracy, heading, speed }
 * @returns {object} Updated location
 */
async function updateCaptainLocation(captainId, coordinates) {
  try {
    const { latitude, longitude, accuracy, heading, speed } = coordinates;

    // Validate coordinates
    if (!validateCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }

    const locationData = {
      captainId,
      location: {
        latitude,
        longitude,
        accuracy: accuracy || 0,
        heading: heading || 0,
        speed: speed || 0
      },
      timestamp: new Date(),
      status: 'active'
    };

    // Update database
    await captainModel.findByIdAndUpdate(captainId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    // Update cache
    locationCache.set(`captain:${captainId}`, locationData);

    return locationData;
  } catch (error) {
    console.error('Error updating captain location:', error);
    throw error;
  }
}

/**
 * Get captain's current location
 * @param {string} captainId - Captain's ID
 * @returns {object} Captain location
 */
async function getCaptainLocation(captainId) {
  try {
    // Check cache first
    const cached = locationCache.get(`captain:${captainId}`);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const captain = await captainModel.findById(captainId);
    if (!captain || !captain.location) {
      throw new Error('Captain location not found');
    }

    const locationData = {
      captainId,
      location: {
        latitude: captain.location.coordinates[1],
        longitude: captain.location.coordinates[0],
        accuracy: 0,
        heading: 0,
        speed: 0
      },
      timestamp: new Date(),
      status: captain.status
    };

    // Cache for future requests
    locationCache.set(`captain:${captainId}`, locationData);

    return locationData;
  } catch (error) {
    console.error('Error getting captain location:', error);
    throw error;
  }
}

/**
 * Find nearby available captains
 * @param {object} coordinates - { latitude, longitude }
 * @param {number} radius - Search radius in meters
 * @param {string} vehicleType - Type of vehicle
 * @returns {array} List of nearby captains
 */
async function getNearbyCaptains(coordinates, radius = 5000, vehicleType = null) {
  try {
    const cacheKey = `nearby:${coordinates.latitude}:${coordinates.longitude}:${radius}:${vehicleType}`;
    
    // Check cache
    const cached = nearbyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { latitude, longitude } = coordinates;

    // MongoDB geospatial query
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius
        }
      },
      status: 'active'
    };

    if (vehicleType) {
      query['vehicle.type'] = vehicleType;
    }

    const captains = await captainModel.find(query).limit(20);

    // Cache results
    nearbyCache.set(cacheKey, captains);

    return captains;
  } catch (error) {
    console.error('Error finding nearby captains:', error);
    throw error;
  }
}

/**
 * Calculate ETA between two points
 * @param {object} origin - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @param {string} mode - Transport mode (driving, walking)
 * @returns {number} ETA in minutes
 */
function calculateETA(origin, destination, mode = 'driving') {
  try {
    const distance = calculateDistance(origin, destination);
    
    // Average speeds in meters per minute
    const speeds = {
      driving: 500,  // ~30 km/h average in city
      walking: 83,   // ~5 km/h
      bike: 250      // ~15 km/h
    };

    const speed = speeds[mode] || speeds.driving;
    const eta = Math.ceil(distance / speed);

    return eta;
  } catch (error) {
    console.error('Error calculating ETA:', error);
    throw error;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {object} origin - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @returns {number} Distance in meters
 */
function calculateDistance(origin, destination) {
  try {
    const distance = getDistance(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
    return distance;
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
}

/**
 * Validate coordinates for Colombia-Venezuela region
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Valid or not
 */
function validateCoordinates(lat, lng) {
  // Colombia-Venezuela region: lat [0°N - 13°N], lng [-78°W - -60°W]
  const isValidLat = lat >= 0 && lat <= 13;
  const isValidLng = lng >= -78 && lng <= -60;
  const isNumber = typeof lat === 'number' && typeof lng === 'number';
  const isNotNaN = !isNaN(lat) && !isNaN(lng);

  return isValidLat && isValidLng && isNumber && isNotNaN;
}

/**
 * Get captain's movement history
 * @param {string} captainId - Captain's ID
 * @param {number} duration - Duration in seconds
 * @returns {array} Location history
 */
function getCaptainMovementHistory(captainId, duration = 60) {
  try {
    const historyKey = `history:${captainId}`;
    const history = locationCache.get(historyKey) || [];
    
    const cutoffTime = new Date(Date.now() - duration * 1000);
    const recentHistory = history.filter(point => point.timestamp >= cutoffTime);
    
    return recentHistory;
  } catch (error) {
    console.error('Error getting movement history:', error);
    return [];
  }
}

module.exports = {
  updateCaptainLocation,
  getCaptainLocation,
  getNearbyCaptains,
  calculateETA,
  calculateDistance,
  validateCoordinates,
  getCaptainMovementHistory
};
