import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Map } from 'ol';
import { Layer } from 'ol/layer';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

type MeasurementType = 'distance' | 'angle' | 'polyline' | null;

interface MeasurementLayers {
  distance: VectorLayer<VectorSource>;
  angle: VectorLayer<VectorSource>;
  polyline: VectorLayer<VectorSource>;
}

interface MeasurementContextType {
  activeMeasurement: MeasurementType;
  map: Map | null;
  measurementLayers: MeasurementLayers;
  setMap: (map: Map | null) => void;
  toggleMeasurement: (type: MeasurementType) => void;
  clearMeasurement: (type: MeasurementType) => void;
  clearAllMeasurements: () => void;
}

const createVectorLayer = () => new VectorLayer({
  source: new VectorSource(),
  style: undefined // zde můžete definovat výchozí styl
});

const MeasurementContext = createContext<MeasurementContextType | undefined>(undefined);

export const MeasurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType>(null);
  const [map, setMap] = useState<Map | null>(null);
  
  // Vytvoření a udržování referencí na vrstvy
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
      // Pokud vypínáme aktivní měření
      if (prev === type) {
        return null;
      }
      
      // Pokud zapínáme nové měření, vyčistíme předchozí
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