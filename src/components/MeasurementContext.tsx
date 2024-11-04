import React, { createContext, useContext, useState, useCallback } from 'react';
import { Map } from 'ol';

type MeasurementType = 'distance' | 'angle' | null;

interface MeasurementContextType {
  activeMeasurement: MeasurementType;
  map: Map | null;
  setMap: (map: Map | null) => void;
  toggleMeasurement: (type: MeasurementType) => void;
}

const MeasurementContext = createContext<MeasurementContextType | undefined>(undefined);

export const MeasurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType>(null);
  const [map, setMap] = useState<Map | null>(null);

  const toggleMeasurement = useCallback((type: MeasurementType) => {
    setActiveMeasurement(prev => prev === type ? null : type);
  }, []);

  return (
    <MeasurementContext.Provider value={{ activeMeasurement, map, setMap, toggleMeasurement }}>
      {children}
    </MeasurementContext.Provider>
  );
};

export const useMeasurement = () => {
  const context = useContext(MeasurementContext);
  if (context === undefined) {
    throw new Error('useMeasurement must be used within a MeasurementProvider');
  }
  return context;
};