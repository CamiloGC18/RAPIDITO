import { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { uberLikeMapStyle, defaultMapOptions } from '../../config/mapStyles';

const libraries = ['places', 'geometry'];

const MapContainer = ({ 
  center = { lat: 8.7832, lng: -75.8845 }, // Montería, Colombia (example)
  zoom = 15, 
  darkMode = false,
  onMapLoad,
  children,
  className = 'w-full h-full'
}) => {
  const [map, setMap] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const mapOptions = {
    ...defaultMapOptions,
    styles: darkMode ? [] : uberLikeMapStyle,
    center,
    zoom
  };

  const onLoad = (mapInstance) => {
    setMap(mapInstance);
    if (onMapLoad) {
      onMapLoad(mapInstance);
    }
  };

  const onUnmount = () => {
    setMap(null);
  };

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">Error al cargar el mapa</p>
          <p className="text-gray-600 text-sm mt-2">
            Por favor verifica la configuración de Google Maps API
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName={className}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {children}
    </GoogleMap>
  );
};

export default MapContainer;
