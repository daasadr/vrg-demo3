import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { MeasurementType, MeasurementContextType, MeasurementLayers } from '../types/measurement.types';


const createVectorLayer = () => new VectorLayer({
  source: new VectorSource(),
  style: undefined // define default style here
});

const MeasurementContext = createContext<MeasurementContextType | undefined>(undefined);

export const MeasurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType>(null);
  const [map, setMap] = useState<Map | null>(null);
  
  // Creating and maintaining layer references
  const measurementLayers = useRef<MeasurementLayers>({
    distance: createVectorLayer(),
    angle: createVectorLayer(),
    polyline: createVectorLayer()
  });

  const clearMeasurement = useCallback((type: MeasurementType) => {
    if (!type) return;
    const layer = measurementLayers.current[type];
    if (layer) {
      layer.getSource()?.clear();
    }
  }, []);

  const clearAllMeasurements = useCallback(() => {
    Object.values(measurementLayers.current).forEach(layer => {
      layer.getSource()?.clear();
    });
  }, []);

  const toggleMeasurement = useCallback((type: MeasurementType) => {
    setActiveMeasurement(prev => {
      // If we turn off active measurement
      if (prev === type) {
        return null;
      }
      
      // If we turn on a new measurement, we clear the previous one
      if (prev) {
        clearMeasurement(prev);
      }
      return type;
    });
  }, [clearMeasurement]);

  return (
    <MeasurementContext.Provider 
      value={{ 
        activeMeasurement, 
        map, 
        measurementLayers: measurementLayers.current,
        setMap, 
        toggleMeasurement,
        clearMeasurement,
        clearAllMeasurements
      }}
    >
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