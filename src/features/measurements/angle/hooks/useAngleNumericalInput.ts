import { useState, useEffect, } from 'react';
import { transform } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { CoordinateSystem } from '../types/angle.types';

export const useAngleNumericalInput = (
  onPointsChange: (points: Coordinate[]) => void,
  initialPoints?: Coordinate[]
) => {
  const [points, setPoints] = useState<Coordinate[]>(initialPoints || []);
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>('EPSG:4326');

  useEffect(() => {
    const transformedPoints = points.map(point => 
      transform(point, coordinateSystem, 'EPSG:3857') as Coordinate
    );
    onPointsChange(transformedPoints);
  }, [points, coordinateSystem, onPointsChange]);

  const handleInputChange = (
    index: number,
    coord: 'x' | 'y',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newPoints = [...points];
      if (!newPoints[index]) {
        newPoints[index] = [0, 0];
      }
      newPoints[index] = [...newPoints[index]];
      newPoints[index][coord === 'x' ? 0 : 1] = numValue;
      setPoints(newPoints);
    }
  };

  const handleCoordinateSystemChange = (newSystem: CoordinateSystem) => {
    const newPoints = points.map(point => 
      transform(point, coordinateSystem, newSystem) as Coordinate
    );
    setPoints(newPoints);
    setCoordinateSystem(newSystem);
  };

  return {
    points,
    coordinateSystem,
    handleInputChange,
    handleCoordinateSystemChange
  };
};