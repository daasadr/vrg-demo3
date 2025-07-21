import { useEffect, useRef, useState, useCallback } from 'react';
import { Map } from 'ol';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Draw, Modify } from 'ol/interaction';
import { MeasurementPoint, DistanceUnit } from '../../shared/types/measurement.types';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';
import useDistanceStyles from './useDistanceStyles';

export const useDistanceMeasurement = (
  map: Map | null,
  isActive: boolean
) => {
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [distance, setDistance] = useState<number>(0);
  const [azimuth, setAzimuth] = useState<number>(0);
  const [hasLine, setHasLine] = useState(false);
  const styles = useDistanceStyles();
  const drawRef = useRef<Draw | null>(null);
  const modifyRef = useRef<Modify | null>(null);
  const { measurementLayers } = useMeasurement();
  const source = measurementLayers.distance.getSource();
  
  const [points, setPoints] = useState<MeasurementPoint[]>([
    { coordinates: { longitude: 0, latitude: 0 }, id: crypto.randomUUID() },
    { coordinates: { longitude: 0, latitude: 0 }, id: crypto.randomUUID() }
  ]);
  
  const calculateAzimuth = useCallback((start: [number, number], end: [number, number]) => {
    const deltaLon = (end[0] - start[0]) * Math.PI / 180;
    const lat1 = start[1] * Math.PI / 180;
    const lat2 = end[1] * Math.PI / 180;
    
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360
    
    setAzimuth(Math.round(bearing * 100) / 100);
  }, []); 

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
    
    setHasLine(true);
  }, []);

const calculateDistance = useCallback((coords: number[][]) => {
  if (!coords || coords.length !== 2) {
    setDistance(0);
    setAzimuth(0);
    return;
  }
  
  const line = new LineString(coords);
  const lengthInMeters = line.getLength();
  const distanceValue = unit === 'km' 
    ? lengthInMeters / 1000 
    : (lengthInMeters / 1000) * 0.621371;

  setDistance(Math.round(distanceValue * 1000) / 1000);

  const startLonLat = toLonLat(coords[0]);
  const endLonLat = toLonLat(coords[1]);
  
  calculateAzimuth(
    [startLonLat[0], startLonLat[1]], 
    [endLonLat[0], endLonLat[1]]
  );
}, [unit, calculateAzimuth]);

  const updateMapFeatures = useCallback(() => {
    if (!source || !isActive) return;
    
    source.clear();
    
    const features: Feature[] = [];
    const mapCoords = points.map(point => 
      fromLonLat([point.coordinates.longitude, point.coordinates.latitude])
    );

    // Add points
    mapCoords.forEach((coord, index) => {
      const pointFeature = new Feature(new Point(coord));
      pointFeature.set('pointIndex', index);
      pointFeature.setStyle(styles.pointStyle({ isSelected: true }));
      features.push(pointFeature);
    });

    // Add line if we have both points
    if (mapCoords.length === 2 && hasLine) {
      const lineFeature = new Feature(new LineString(mapCoords));
      lineFeature.setStyle(styles.lineStyle({ isSelected: true }));
      features.push(lineFeature);
      calculateDistance(mapCoords);
    }

    features.forEach(feature => source.addFeature(feature));
  }, [source, points, styles, calculateDistance, hasLine, isActive]);

  const initializeDrawInteraction = useCallback(() => {
    if (!map || !source || !isActive) return;

    const draw = new Draw({
      source,
      type: 'LineString',
      style: (feature) => {
        const geometry = feature.getGeometry();
        if (geometry instanceof LineString) {
          return [
            styles.lineStyle({ isSelected: true }),
            ...geometry.getCoordinates().map(() => styles.pointStyle({ isSelected: true }))
          ];
        }
        return styles.pointStyle({ isSelected: true });
      },
      maxPoints: 2
    });
    
    draw.on('drawstart', () => {
      source.clear();
      setHasLine(false);
    });

    draw.on('drawend', (event) => {
      const geometry = event.feature.getGeometry();
      if (!(geometry instanceof LineString)) return;

      const coords = geometry.getCoordinates();
      const newPoints = coords.map(coord => {
        const [lon, lat] = toLonLat(coord);
        return {
          coordinates: {
            longitude: Number(lon.toFixed(5)),
            latitude: Number(lat.toFixed(5))
          },
          id: crypto.randomUUID()
        };
      });
      
      setPoints(newPoints);
      setHasLine(true);
      
      initializeModifyInteraction();
    });

    map.addInteraction(draw);
    drawRef.current = draw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, source, styles, isActive]);

  const initializeModifyInteraction = useCallback(() => {
    if (!map || !source || !isActive) return;

    if (modifyRef.current) {
      map.removeInteraction(modifyRef.current);
    }

    const modify = new Modify({
      source,
      style: styles.pointStyle({ isSelected: true }),
      pixelTolerance: 15
    });

    modify.on('modifyend', () => {
      const features = source.getFeatures()
        .filter(f => f.getGeometry() instanceof Point)
        .sort((a, b) => {
          const indexA = a.get('pointIndex') ?? 0;
          const indexB = b.get('pointIndex') ?? 0;
          return indexA - indexB;
        });

      const newPoints = features.map(feature => {
        const geometry = feature.getGeometry() as Point;
        const [lon, lat] = toLonLat(geometry.getCoordinates());
        return {
          coordinates: {
            longitude: Number(lon.toFixed(5)),
            latitude: Number(lat.toFixed(5))
          },
          id: crypto.randomUUID()
        };
      });

      setPoints(newPoints);
    });

    map.addInteraction(modify);
    modifyRef.current = modify;
  }, [map, source, styles, isActive]);

  useEffect(() => {
    if (!map || !isActive) {
      if (drawRef.current) map?.removeInteraction(drawRef.current);
      if (modifyRef.current) map?.removeInteraction(modifyRef.current);
      drawRef.current = null;
      modifyRef.current = null;
      return;
    }

    if (hasLine) {
      initializeModifyInteraction();
    } else {
      initializeDrawInteraction();
    }

    return () => {
      if (drawRef.current) map.removeInteraction(drawRef.current);
      if (modifyRef.current) map.removeInteraction(modifyRef.current);
    };
  }, [map, isActive, hasLine, initializeDrawInteraction, initializeModifyInteraction]);

  // Update features whenever points change
  useEffect(() => {
    updateMapFeatures();
  }, [points, updateMapFeatures]);
  
  useEffect(() => {
    if (!map || !measurementLayers.distance) return;

    if (isActive) {
      map.addLayer(measurementLayers.distance);
    } else {
      map.removeLayer(measurementLayers.distance);
      source?.clear();
      setHasLine(false);
    }

    return () => {
      if (map && measurementLayers.distance) {
        map.removeLayer(measurementLayers.distance);
        source?.clear();
      }
    };
  }, [map, isActive, measurementLayers, source]);

  const startNewMeasurement = useCallback(() => {
    if (!source) return;
    
    source.clear();
    setDistance(0);
    setHasLine(false);
    setPoints([
      { coordinates: { longitude: 0, latitude: 0 }, id: crypto.randomUUID() },
      { coordinates: { longitude: 0, latitude: 0 }, id: crypto.randomUUID() }
    ]);

    if (map && isActive) {
      if (drawRef.current) map.removeInteraction(drawRef.current);
      if (modifyRef.current) map.removeInteraction(modifyRef.current);
      initializeDrawInteraction();
    }
  }, [map, isActive, source, initializeDrawInteraction]);

  return {
    points,
    updatePoint,
    unit,
    setUnit,
    distance,
    azimuth,
    startNewMeasurement
  };
};