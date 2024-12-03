import { useRef, useState, useCallback, useEffect } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { LineString, Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import { Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { createStyle, setupMapInteractions } from '../utils/angleMapUtils';
import { AngleUnit } from '../types/angle.types';

export const useAngleMeasurement = (map: Map | null, isActive: boolean) => {
  const sourceRef = useRef<VectorSource>(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<VectorSource>>(
    new VectorLayer({
      source: sourceRef.current,
      style: createStyle()
    })
  );

  const [angle, setAngle] = useState<number>(0);
  const [unit, setUnit] = useState<AngleUnit>('degrees');
  const [coordinates, setCoordinates] = useState<Array<[string, string]>>([
    ['', ''],
    ['', ''],
    ['', '']
  ]);

  const updateFeaturesFromCoordinates = useCallback((mapCoords: Coordinate[]) => {
    sourceRef.current.clear();

    if (mapCoords.length >= 2) {
      const lineStringFeature = new Feature(new LineString(mapCoords));
      sourceRef.current.addFeature(lineStringFeature);
    }

    mapCoords.forEach((coord, index) => {
      const pointFeature = new Feature(new Point(coord));
      pointFeature.set('pointIndex', index);
      sourceRef.current.addFeature(pointFeature);
    });
  }, []);

  const calculateAngle = useCallback((coords: Coordinate[]) => {
    if (coords.length !== 3) return;

    const [p1, p2, p3] = coords;
    const angle1 = Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
    const angle2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);

    if (angle > 180) {
      angle = 360 - angle;
    }

    setAngle(angle);
  }, []);

  useEffect(() => {
    if (!map || !isActive) return;

    map.addLayer(vectorLayerRef.current);
    const cleanup = setupMapInteractions(
      map, 
      sourceRef.current, 
      updateFeaturesFromCoordinates, 
      calculateAngle, 
      setCoordinates
    );

    return () => {
      cleanup();
      map.removeLayer(vectorLayerRef.current);
      sourceRef.current.clear();
      setAngle(0);
      setCoordinates([['', ''], ['', ''], ['', '']]);
    };
  }, [map, isActive, updateFeaturesFromCoordinates, calculateAngle]);

  const handleCoordinateChange = (index: number, type: 'lon' | 'lat', value: string) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index] = [...coordinates[index]];
    newCoordinates[index][type === 'lon' ? 0 : 1] = value;
    setCoordinates(newCoordinates);
  };

  const measureFromCoordinates = () => {
    const parsedCoords = coordinates.map(coord => [
      parseFloat(coord[0]) || 0,
      parseFloat(coord[1]) || 0
    ]);

    if (parsedCoords.every(coord => !isNaN(coord[0]) && !isNaN(coord[1]))) {
      const mapCoords = parsedCoords.map(coord => fromLonLat(coord));
      updateFeaturesFromCoordinates(mapCoords);
      calculateAngle(mapCoords);
    }
  };

  const startNewMeasurement = useCallback(() => {
    sourceRef.current.clear();
    setAngle(0);
    setCoordinates([['', ''], ['', ''], ['', '']]);
    
    if (map && isActive) {
      const cleanup = setupMapInteractions(
        map, 
        sourceRef.current, 
        updateFeaturesFromCoordinates, 
        calculateAngle, 
        setCoordinates
      );
      return cleanup;
    }
  }, [map, isActive, updateFeaturesFromCoordinates, calculateAngle]);

  return {
    angle,
    unit,
    setUnit,
    coordinates,
    handleCoordinateChange,
    measureFromCoordinates,
    startNewMeasurement
  };
};