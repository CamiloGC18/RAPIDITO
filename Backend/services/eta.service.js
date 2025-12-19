const { Client } = require('@googlemaps/google-maps-services-js');
const { calculateDistance } = require('./location.service');

const googleMapsClient = new Client({});

/**
 * Calculate initial ETA using Google Distance Matrix API
 * @param {object} origin - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @param {string} vehicleType - Type of vehicle (car, bike, auto)
 * @returns {number} ETA in minutes
 */
async function calculateInitialETA(origin, destination, vehicleType = 'car') {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Fallback to simple calculation if no API key
      const distance = calculateDistance(origin, destination);
      const speeds = { car: 500, bike: 250, auto: 400 }; // meters per minute
      return Math.ceil(distance / (speeds[vehicleType] || speeds.car));
    }

    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [`${origin.latitude},${origin.longitude}`],
        destinations: [`${destination.latitude},${destination.longitude}`],
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK' || !response.data.rows.length) {
      throw new Error('Unable to calculate ETA');
    }

    const element = response.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      throw new Error('Route not found');
    }

    // Get duration in traffic or regular duration
    const durationSeconds = element.duration_in_traffic?.value || element.duration.value;
    const etaMinutes = Math.ceil(durationSeconds / 60);

    // Adjust based on vehicle type
    const adjustmentFactors = {
      car: 1.0,
      bike: 0.8,  // Bikes can be faster in traffic
      auto: 0.9   // Autos are moderately fast
    };

    const adjustedETA = Math.ceil(etaMinutes * (adjustmentFactors[vehicleType] || 1.0));

    return adjustedETA;
  } catch (error) {
    console.error('Error calculating initial ETA:', error);
    // Fallback calculation
    const distance = calculateDistance(origin, destination);
    const speeds = { car: 500, bike: 250, auto: 400 };
    return Math.ceil(distance / (speeds[vehicleType] || speeds.car));
  }
}

/**
 * Update ETA dynamically based on current conditions
 * @param {object} currentLocation - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @param {number} currentSpeed - Speed in m/s
 * @param {object} traffic - Traffic conditions
 * @returns {number} Updated ETA in minutes
 */
function updateETADynamic(currentLocation, destination, currentSpeed = 0, traffic = null) {
  try {
    const remainingDistance = calculateDistance(currentLocation, destination);

    // If speed is available and reasonable, use it
    let effectiveSpeed = currentSpeed;
    
    if (!effectiveSpeed || effectiveSpeed < 1) {
      // Default to 8.33 m/s (~30 km/h city average)
      effectiveSpeed = 8.33;
    }

    // Apply traffic multiplier
    let trafficMultiplier = 1.0;
    if (traffic) {
      trafficMultiplier = considerTraffic(0, traffic);
    }

    // Calculate ETA
    const baseETA = remainingDistance / (effectiveSpeed * 60); // Convert to minutes
    const adjustedETA = Math.ceil(baseETA * trafficMultiplier);

    return Math.max(1, adjustedETA); // At least 1 minute
  } catch (error) {
    console.error('Error updating ETA dynamically:', error);
    return 5; // Default fallback
  }
}

/**
 * Adjust ETA based on traffic conditions
 * @param {number} baseETA - Base ETA in minutes
 * @param {object} trafficConditions - Traffic data
 * @returns {number} Adjusted ETA multiplier
 */
function considerTraffic(baseETA, trafficConditions) {
  try {
    const condition = trafficConditions.condition || 'green';
    
    const multipliers = {
      green: 1.0,
      yellow: 1.2,
      red: 1.5
    };

    return multipliers[condition] || 1.0;
  } catch (error) {
    console.error('Error considering traffic:', error);
    return 1.0;
  }
}

/**
 * Get historical time data for route
 * @param {object} route - Route information
 * @param {string} timeOfDay - Time period (morning, afternoon, evening, night)
 * @returns {number} Historical average time in minutes
 */
function getHistoricalTimeData(route, timeOfDay = 'afternoon') {
  try {
    // This is a simplified version. In production, you'd query historical data
    const baseTime = route.duration / 60; // Convert to minutes

    // Apply time-of-day multipliers based on typical traffic patterns
    const multipliers = {
      morning: 1.3,    // Rush hour
      afternoon: 1.1,   // Moderate traffic
      evening: 1.4,     // Peak rush hour
      night: 0.9        // Light traffic
    };

    return Math.ceil(baseTime * (multipliers[timeOfDay] || 1.0));
  } catch (error) {
    console.error('Error getting historical time data:', error);
    return route.duration / 60;
  }
}

/**
 * Predict arrival time based on movement patterns
 * @param {object} currentLocation - { latitude, longitude }
 * @param {object} destination - { latitude, longitude }
 * @param {array} movementPattern - Recent location history
 * @returns {number} Predicted ETA in minutes
 */
function predictArrivalTime(currentLocation, destination, movementPattern = []) {
  try {
    if (!movementPattern || movementPattern.length < 2) {
      // Not enough data, use simple calculation
      const distance = calculateDistance(currentLocation, destination);
      return Math.ceil(distance / 500); // Assume 500 m/min
    }

    // Calculate average speed from movement pattern
    let totalSpeed = 0;
    let speedCount = 0;

    for (let i = 1; i < movementPattern.length; i++) {
      const prev = movementPattern[i - 1];
      const curr = movementPattern[i];
      
      const distance = calculateDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      
      if (timeDiff > 0) {
        const speed = distance / timeDiff; // m/s
        totalSpeed += speed;
        speedCount++;
      }
    }

    const avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 8.33; // m/s
    const remainingDistance = calculateDistance(currentLocation, destination);
    const eta = Math.ceil(remainingDistance / (avgSpeed * 60)); // minutes

    return Math.max(1, eta);
  } catch (error) {
    console.error('Error predicting arrival time:', error);
    const distance = calculateDistance(currentLocation, destination);
    return Math.ceil(distance / 500);
  }
}

module.exports = {
  calculateInitialETA,
  updateETADynamic,
  considerTraffic,
  getHistoricalTimeData,
  predictArrivalTime
};
