import { useEffect, useState } from 'react';
import { Marker } from '@react-google-maps/api';
import MapContainer from './MapContainer';
import CaptainMarker from './CaptainMarker';
import RoutePolyline from './RoutePolyline';
import ETADisplay from './ETADisplay';

const LiveTrackingMap = ({
  rideId,
  userLocation,
  captainLocation,
  route = [],
  pickupETA,
  dropoffETA,
  currentPhase = 'awaiting-captain',
  vehicleType = 'car'
}) => {
  const [map, setMap] = useState(null);
  const [bounds, setBounds] = useState(null);

  // Update map bounds to show both markers
  useEffect(() => {
    if (map && userLocation && captainLocation) {
      const newBounds = new window.google.maps.LatLngBounds();
      newBounds.extend(userLocation);
      newBounds.extend(captainLocation);
      
      // Add some padding
      map.fitBounds(newBounds, 100);
      setBounds(newBounds);
    } else if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, userLocation, captainLocation]);

  const mapCenter = captainLocation || userLocation || { lat: 8.7832, lng: -75.8845 };

  // Check if Google Maps is loaded
  const isGoogleMapsLoaded = window.google?.maps?.SymbolPath !== undefined;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={15}
        onMapLoad={setMap}
        className="w-full h-full"
      >
        {isGoogleMapsLoaded && (
          <>
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2
                }}
                title="Tu ubicación"
              />
            )}

            {/* Captain marker */}
            {captainLocation && (
              <CaptainMarker
                position={captainLocation}
                heading={captainLocation.heading}
                speed={captainLocation.speed}
                vehicleType={vehicleType}
                isMoving={captainLocation.speed > 0}
              />
            )}

            {/* Route polyline */}
            {route && route.length > 0 && (
              <RoutePolyline
                path={route}
                phase={currentPhase}
                animate={true}
              />
            )}
          </>
        )}
      </MapContainer>

      {/* ETA overlay */}
      {currentPhase !== 'completed' && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <ETADisplay
            eta={currentPhase === 'captain-arriving' ? pickupETA : dropoffETA}
            distance={0} // Can be calculated from route
            phase={currentPhase}
          />
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
