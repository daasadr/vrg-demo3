import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Feature } from 'ol';
import { LineString } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';
import { DistanceDisplay } from './DistanceDisplay';
import DistanceNumericalInput from './DistanceNumericalInput';
import { useMeasurementLayer } from '../hooks/useMeasurementLayer';
import { useDrawInteraction } from '../hooks/useDrawInteraction';
import { DistanceMeasurementProps, DistanceUnit } from '../types/distance.types';

const DistanceMeasurement: React.FC<DistanceMeasurementProps> = ({ isActive }) => {
  const { map, activeMeasurement } = useMeasurement();
  const [distance, setDistance] = useState<number | null>(null);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [mapPoints, setMapPoints] = useState<{ start?: [number, number]; end?: [number, number] }>({});
  const isUpdatingFromDraw = useRef(false);
  const isMeasurementActive = useRef(false);

  const vectorLayerRef = useMeasurementLayer(map);

  const updateMeasurement = useCallback((feature: Feature<LineString>) => {
    if (!feature) return;

    const line = feature.getGeometry();
    if (!(line instanceof LineString)) return;

    const coordinates = line.getCoordinates();
    if (coordinates.length >= 2) {
      isUpdatingFromDraw.current = true;
      
      setMapPoints({
        start: coordinates[0] as [number, number],
        end: coordinates[1] as [number, number]
      });
      
      const length = getLength(line);
      setDistance(length / 1000); // Převod na kilometry
      
      isUpdatingFromDraw.current = false;
    }
  }, []);

  const clearMeasurement = useCallback(() => {
    if (vectorLayerRef.current) {
      vectorLayerRef.current.getSource()?.clear();
    }
    setMapPoints({});
    setDistance(null);
  }, []);

 const handleCoordinatesChange = useCallback((start: [number, number], end: [number, number]) => {
  if (!vectorLayerRef.current || isUpdatingFromDraw.current) return;

  const source = vectorLayerRef.current.getSource()!;
  source.clear();

  const lineFeature = new Feature(new LineString([start, end]));
  source.addFeature(lineFeature);
  updateMeasurement(lineFeature);
}, [updateMeasurement]);

  const { startDrawing, stopDrawing } = useDrawInteraction(
    map,
    vectorLayerRef.current?.getSource() ?? null,
    updateMeasurement
  );

  useEffect(() => {
  if (activeMeasurement === 'distance' && !isMeasurementActive.current) {
    clearMeasurement();
    startDrawing();
    isMeasurementActive.current = true;
  } else if (activeMeasurement !== 'distance' && isMeasurementActive.current) {
    stopDrawing();
    clearMeasurement();
    isMeasurementActive.current = false;
  }
}, [activeMeasurement, startDrawing, stopDrawing, clearMeasurement]);

  return (
    <Box sx={{ p: 2 }}>
      <DistanceNumericalInput
        onCoordinatesChange={handleCoordinatesChange}
        mapPoints={mapPoints}
      />
      <DistanceDisplay
        distance={distance}
        unit={unit}
        onUnitChange={setUnit}
      />
    </Box>
  );
};

export default DistanceMeasurement;