/**
 * Configuration constants for the tracking system
 */

// Coordinate validation bounds for service region
// Colombia-Venezuela region: lat [0°N - 13°N], lng [-78°W - -60°W]
module.exports.COORDINATE_BOUNDS = {
  LAT_MIN: 0,
  LAT_MAX: 13,
  LNG_MIN: -78,
  LNG_MAX: -60
};

// Cache TTL values (in seconds)
module.exports.CACHE_TTL = {
  LOCATION: 30,      // Captain location cache
  NEARBY: 10,        // Nearby captains cache
  ROUTE: 300         // Route cache
};

// Location update thresholds
module.exports.LOCATION_THRESHOLDS = {
  MIN_MOVEMENT_METERS: 10,  // Minimum movement to trigger update
  UPDATE_INTERVAL_MS: 3000   // Minimum interval between updates
};

// Speed constants (meters per minute)
module.exports.SPEED = {
  DRIVING: 500,  // ~30 km/h city average
  WALKING: 83,   // ~5 km/h
  BIKE: 250      // ~15 km/h
};

// ETA adjustment factors by vehicle type
module.exports.VEHICLE_ETA_FACTORS = {
  car: 1.0,
  bike: 0.8,  // Bikes faster in traffic
  auto: 0.9   // Autos moderately fast
};

// Traffic multipliers
module.exports.TRAFFIC_MULTIPLIERS = {
  green: 1.0,
  yellow: 1.2,
  red: 1.5
};

// Time-of-day multipliers for historical data
module.exports.TIME_MULTIPLIERS = {
  morning: 1.3,    // Rush hour
  afternoon: 1.1,   // Moderate traffic
  evening: 1.4,     // Peak rush hour
  night: 0.9        // Light traffic
};
