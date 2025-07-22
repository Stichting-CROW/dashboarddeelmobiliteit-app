import React, { createContext, useContext, useRef, ReactNode } from 'react';
import maplibregl from 'maplibre-gl';

interface MapContextType {
  map: maplibregl.Map | null;
  setMap: (map: maplibregl.Map | null) => void;
  getMap: () => maplibregl.Map | null;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const mapRef = useRef<maplibregl.Map | null>(null);

  const setMap = (map: maplibregl.Map | null) => {
    mapRef.current = map;
    // Keep the global reference for backward compatibility
    if (map) {
      (window as any)['ddMap'] = map;
    } else {
      delete (window as any)['ddMap'];
    }
  };

  const getMap = () => mapRef.current;

  const value: MapContextType = {
    map: mapRef.current,
    setMap,
    getMap
  };

  // Expose context on window for backward compatibility
  React.useEffect(() => {
    (window as any).__MAP_CONTEXT__ = value;
    return () => {
      delete (window as any).__MAP_CONTEXT__;
    };
  }, [value]);

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}; 