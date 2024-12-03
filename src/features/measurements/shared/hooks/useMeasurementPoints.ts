import { useState, useCallback, useEffect } from 'react';
import { CoordinatePoint, MeasurementPoint } from '../types/measurement.types';

export const useMeasurementPoints = (
  initialPoints: MeasurementPoint[] = [],
  onPointsChange?: (points: MeasurementPoint[]) => void
) => {
  const [points, setPoints] = useState<MeasurementPoint[]>(initialPoints);

  const updatePoint = useCallback((index: number, field: 'longitude' | 'latitude', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setPoints(prevPoints => {
      const newPoints = [...prevPoints];
      if (!newPoints[index]) return prevPoints;
      
      newPoints[index] = {
        ...newPoints[index],
        coordinates: {
          ...newPoints[index].coordinates,
          [field]: numValue
        }
      };
      return newPoints;
    });
  }, []);

  const addPoint = useCallback((coordinates?: CoordinatePoint) => {
    const newPoint: MeasurementPoint = {
      coordinates: coordinates || { longitude: 0, latitude: 0 },
      id: crypto.randomUUID()
    };
    
    setPoints(prevPoints => [...prevPoints, newPoint]);
  }, []);

  const removePoint = useCallback((index: number) => {
    setPoints(prevPoints => prevPoints.filter((_, i) => i !== index));
  }, []);

  const setAllPoints = useCallback((newPoints: CoordinatePoint[]) => {
    setPoints(newPoints.map(coordinates => ({
      coordinates,
      id: crypto.randomUUID()
    })));
  }, []);

  useEffect(() => {
    onPointsChange?.(points);
  }, [points, onPointsChange]);

  return {
    points,
    updatePoint,
    addPoint,
    removePoint,
    setAllPoints
  };
};