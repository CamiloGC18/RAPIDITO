import { formatETA, formatDistance } from '../../utils/geolocation';

const ETADisplay = ({ 
  eta = 0, 
  distance = 0, 
  phase = 'captain-arriving' 
}) => {
  const phaseLabels = {
    'awaiting-captain': 'Buscando conductor...',
    'captain-arriving': 'Tu conductor está llegando',
    'in-progress': 'En camino al destino',
    'completed': 'Viaje completado'
  };

  const phaseIcons = {
    'awaiting-captain': '🔍',
    'captain-arriving': '🚗',
    'in-progress': '🎯',
    'completed': '✅'
  };

  if (phase === 'awaiting-captain') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{phaseIcons[phase]}</span>
          <div>
            <p className="text-gray-700 font-semibold">{phaseLabels[phase]}</p>
            <div className="flex space-x-1 mt-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{phaseIcons[phase]}</span>
          <div>
            <p className="text-gray-500 text-sm">{phaseLabels[phase]}</p>
            <p className="text-2xl font-bold text-gray-900">{formatETA(eta)}</p>
          </div>
        </div>
        {distance > 0 && (
          <div className="text-right">
            <p className="text-gray-500 text-sm">Distancia</p>
            <p className="text-lg font-semibold text-gray-700">{formatDistance(distance)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ETADisplay;
