import React from 'react';
import { useSelector } from 'react-redux';
import { StateType } from '../../types/StateType';

interface PollingStatusIndicatorProps {
  smartPollingManager: any;
  isVisible?: boolean;
}

const PollingStatusIndicator: React.FC<PollingStatusIndicatorProps> = ({ 
  smartPollingManager, 
  isVisible = false 
}) => {
  const displayMode = useSelector((state: StateType) => state.layers?.displaymode);
  
  if (!isVisible) return null;

  const {
    isParkingActive,
    isRentalsActive,
    pauseAllPolling,
    resumeAllPolling,
    forceUpdateAll,
    lastUpdate
  } = smartPollingManager;

  const isActive = displayMode === 'displaymode-park' ? isParkingActive : 
                   displayMode === 'displaymode-rentals' ? isRentalsActive : false;

  const getStatusColor = () => {
    if (!isActive) return 'text-red-500';
    if (displayMode === 'displaymode-park' || displayMode === 'displaymode-rentals') {
      return 'text-green-500';
    }
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (!isActive) return '⏸️ Polling Paused';
    if (displayMode === 'displaymode-park') return '🔄 Parking Data Active';
    if (displayMode === 'displaymode-rentals') return '🔄 Rentals Data Active';
    return '⏸️ No Active Polling';
  };

  const formatLastUpdate = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const age = Date.now() - timestamp;
    if (age < 60000) return `${Math.floor(age / 1000)}s ago`;
    return `${Math.floor(age / 60000)}m ago`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm border border-gray-200 z-50">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="text-xs text-gray-600 mb-2">
        <div>Parking: {formatLastUpdate(lastUpdate.parking)}</div>
        <div>Rentals: {formatLastUpdate(lastUpdate.rentals)}</div>
      </div>
      
      <div className="flex space-x-1">
        <button
          onClick={pauseAllPolling}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Pause
        </button>
        <button
          onClick={resumeAllPolling}
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Resume
        </button>
        <button
          onClick={forceUpdateAll}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default PollingStatusIndicator; 