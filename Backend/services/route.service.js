const { Client } = require('@googlemaps/google-maps-services-js');
const NodeCache = require('node-cache');

// Initialize Google Maps client
const googleMapsClient = new Client({});
const routeCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 minutes cache

/**
 * Get optimal route between origin and destination
 * @param {object} origin - { lat, lng }
 * @param {object} destination - { lat, lng }
 * @param {array} waypoints - Optional waypoints
 * @returns {object} Route data with polyline and points
 */
async function getOptimalRoute(origin, destination, waypoints = []) {
  try {
    const cacheKey = `route:${origin.lat}:${origin.lng}:${destination.lat}:${destination.lng}`;
    
    // Check cache
    const cached = routeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await googleMapsClient.directions({
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        waypoints: waypoints.map(wp => `${wp.lat},${wp.lng}`),
        mode: 'driving',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: apiKey
      }
    });

    if (response.data.status !== 'OK' || !response.data.routes.length) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];
    const encodedPolyline = route.overview_polyline.points;
    const decodedPoints = decodePolyline(encodedPolyline);

    const routeData = {
      polyline: encodedPolyline,
      points: decodedPoints,
      distance: leg.distance.value, // meters
      duration: leg.duration.value, // seconds
      duration_in_traffic: leg.duration_in_traffic?.value || leg.duration.value,
      bounds: route.bounds,
      steps: leg.steps
    };

    // Cache the route
    routeCache.set(cacheKey, routeData);

    return routeData;
  } catch (error) {
    console.error('Error getting optimal route:', error);
    throw error;
  }
}

/**
 * Decode Google Maps polyline to coordinates
 * @param {string} encoded - Encoded polyline string
 * @returns {array} Array of { lat, lng } coordinates
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return points;
}

/**
 * Smooth route using Catmull-Rom spline algorithm
 * @param {array} routePoints - Array of { lat, lng }
 * @returns {array} Smoothed points
 */
function smoothRoute(routePoints) {
  if (routePoints.length < 4) {
    return routePoints;
  }

  const smoothedPoints = [];
  const tension = 0.5; // Catmull-Rom tension

  for (let i = 0; i < routePoints.length - 1; i++) {
    const p0 = routePoints[Math.max(0, i - 1)];
    const p1 = routePoints[i];
    const p2 = routePoints[i + 1];
    const p3 = routePoints[Math.min(routePoints.length - 1, i + 2)];

    // Add intermediate points
    for (let t = 0; t < 1; t += 0.1) {
      const t2 = t * t;
      const t3 = t2 * t;

      const lat = 0.5 * (
        (2 * p1.lat) +
        (-p0.lat + p2.lat) * t +
        (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
        (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
      );

      const lng = 0.5 * (
        (2 * p1.lng) +
        (-p0.lng + p2.lng) * t +
        (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
        (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3
      );

      smoothedPoints.push({ lat, lng });
    }
  }

  // Add last point
  smoothedPoints.push(routePoints[routePoints.length - 1]);

  return smoothedPoints;
}

/**
 * Interpolate points between start and end
 * @param {object} start - { lat, lng }
 * @param {object} end - { lat, lng }
 * @param {number} steps - Number of intermediate steps
 * @returns {array} Interpolated points
 */
function interpolateRoute(start, end, steps = 10) {
  const points = [];
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    points.push({ lat, lng });
  }

  return points;
}

/**
 * Snap coordinates to nearest road
 * @param {array} coordinates - Array of { lat, lng }
 * @returns {array} Snapped coordinates
 */
async function snapToRoad(coordinates) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Google Roads API has a limit of 100 points
    const limitedCoords = coordinates.slice(0, 100);
    const path = limitedCoords.map(c => `${c.lat},${c.lng}`).join('|');

    const response = await googleMapsClient.snapToRoads({
      params: {
        path,
        interpolate: true,
        key: apiKey
      }
    });

    if (response.data.snappedPoints) {
      return response.data.snappedPoints.map(point => ({
        lat: point.location.latitude,
        lng: point.location.longitude
      }));
    }

    return coordinates;
  } catch (error) {
    console.error('Error snapping to road:', error);
    return coordinates; // Return original if snap fails
  }
}

/**
 * Get traffic data for route
 * @param {object} route - Route object
 * @returns {object} Traffic information
 */
function getTrafficData(route) {
  try {
    // Extract traffic data from route
    const trafficLevel = route.duration_in_traffic 
      ? route.duration_in_traffic / route.duration 
      : 1.0;

    let condition = 'green';
    if (trafficLevel > 1.5) {
      condition = 'red';
    } else if (trafficLevel > 1.2) {
      condition = 'yellow';
    }

    return {
      level: trafficLevel,
      condition,
      delayMinutes: Math.round((route.duration_in_traffic - route.duration) / 60)
    };
  } catch (error) {
    console.error('Error getting traffic data:', error);
    return { level: 1.0, condition: 'green', delayMinutes: 0 };
  }
}

/**
 * Update route with traffic considerations
 * @param {object} route - Original route
 * @param {object} trafficData - Traffic information
 * @returns {object} Updated route
 */
function updateRouteWithTraffic(route, trafficData) {
  try {
    const adjustedDuration = Math.round(route.duration * trafficData.level);
    
    return {
      ...route,
      duration: adjustedDuration,
      traffic: trafficData
    };
  } catch (error) {
    console.error('Error updating route with traffic:', error);
    return route;
  }
}

module.exports = {
  getOptimalRoute,
  decodePolyline,
  smoothRoute,
  interpolateRoute,
  snapToRoad,
  getTrafficData,
  updateRouteWithTraffic
};
