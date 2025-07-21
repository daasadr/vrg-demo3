import { useRef, useState, useCallback, useEffect } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat, toLonLat } from 'ol/proj';
import { LineString, Point } from 'ol/geom';
import { Draw, Modify } from 'ol/interaction';
import { Style, Stroke, Circle, Fill } from 'ol/style';
import { FeatureLike } from 'ol/Feature';

export const useAngleMeasurement = (map: Map | null, isActive: boolean) => {
  const sourceRef = useRef<VectorSource>(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<VectorSource>>(
    new VectorLayer({
      source: sourceRef.current,
      style: (feature: FeatureLike) => {
        const geometry = feature.getGeometry();
        if (geometry instanceof LineString) {
          return new Style({
            stroke: new Stroke({
              color: 'red',
              width: 2,
            }),
          });
        } else if (geometry instanceof Point) {
          return new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: 'blue',
              }),
              stroke: new Stroke({
                color: 'white',
                width: 2,
              }),
            }),
          });
        }
        return new Style({});
      }
    })
  );

  const [angle, setAngle] = useState<number>(0);
  const [unit, setUnit] = useState<'degrees' | 'radians'>('degrees');
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

  const setupMapInteractions = useCallback((
    map: Map,
    source: VectorSource,
    updateFeatures: (coords: Coordinate[]) => void,
    calculateAngle: (coords: Coordinate[]) => void,
    setCoordinates: (coords: Array<[string, string]>) => void
  ) => {
    let points: Coordinate[] = [];
    let tempLineFeature: Feature | null = null;
    
    const draw = new Draw({
      source: source,
      type: 'Point',
      stopClick: true,
    });

    const handlePointerMove = (event: any) => {
      if (points.length > 0 && points.length < 3) {
        const mouseCoord = event.coordinate;
        
        if (tempLineFeature) {
          source.removeFeature(tempLineFeature);
        }
        
        const lineCoords = [...points, mouseCoord];
        tempLineFeature = new Feature(new LineString(lineCoords));
        source.addFeature(tempLineFeature);
      }
    };

    map.on('pointermove', handlePointerMove);

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = feature.getGeometry();
      
      if (geometry instanceof Point) {
        const coord = geometry.getCoordinates();
        
        if (points.length < 3) {
          points.push(coord);
          feature.set('pointIndex', points.length - 1);
          
          if (tempLineFeature) {
            source.removeFeature(tempLineFeature);
            tempLineFeature = null;
          }
          
          const newCoordinates: Array<[string, string]> = points.map(point => {
            const lonLatPoint = toLonLat(point);
            return [lonLatPoint[0].toFixed(6), lonLatPoint[1].toFixed(6)];
          });
          
          while (newCoordinates.length < 3) {
            newCoordinates.push(['', '']);
          }
          
          setCoordinates(newCoordinates);

          if (points.length >= 2) {
            source.getFeatures()
              .filter(f => f.getGeometry() instanceof LineString && f !== tempLineFeature)
              .forEach(f => source.removeFeature(f));
              
            const lineString = new Feature(new LineString(points));
            source.addFeature(lineString);
          }

          if (points.length === 3) {
            updateFeatures(points);
            calculateAngle(points);
            map.removeInteraction(draw);
            map.un('pointermove', handlePointerMove);
          }
        }
      }
    });

    const modify = new Modify({ source: source });

    modify.on('modifyend', () => {
      const features = source.getFeatures();
      const pointFeatures = features
        .filter(f => f.getGeometry() instanceof Point)
        .sort((a, b) => (a.get('pointIndex') || 0) - (b.get('pointIndex') || 0));

      points = pointFeatures
        .map(f => f.getGeometry())
        .filter((g): g is Point => g instanceof Point)
        .map(g => g.getCoordinates());

      if (points.length === 3) {
        const lineFeatures = features.filter(f => f.getGeometry() instanceof LineString);
        lineFeatures.forEach(f => source.removeFeature(f));
        
        const lineString = new Feature(new LineString(points));
        source.addFeature(lineString);

        const newCoordinates: Array<[string, string]> = points.map(point => {
          const lonLatPoint = toLonLat(point);
          return [lonLatPoint[0].toFixed(6), lonLatPoint[1].toFixed(6)];
        });
        
        setCoordinates(newCoordinates);
        calculateAngle(points);
      }
    });

    map.addInteraction(modify);
    map.addInteraction(draw);

    return () => {
      points = [];
      if (tempLineFeature) {
        source.removeFeature(tempLineFeature);
      }
      map.removeInteraction(draw);
      map.removeInteraction(modify);
      map.un('pointermove', handlePointerMove);
      source.clear();
    };
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
      // Capture ref values to avoid stale closure issues
      const vectorLayer = vectorLayerRef.current;
      const source = sourceRef.current;
      if (vectorLayer) {
        map.removeLayer(vectorLayer);
      }
      if (source) {
        source.clear();
      }
      setAngle(0);
      setCoordinates([['', ''], ['', ''], ['', '']]);
    };
  }, [map, isActive, updateFeaturesFromCoordinates, calculateAngle, setupMapInteractions]);

  const handleCoordinateChange = useCallback((index: number, type: 'lon' | 'lat', value: string) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index] = [...coordinates[index]];
    newCoordinates[index][type === 'lon' ? 0 : 1] = value;
    setCoordinates(newCoordinates);

    const parsedCoords = newCoordinates.map(coord => [
      parseFloat(coord[0]) || 0,
      parseFloat(coord[1]) || 0
    ]);

    if (parsedCoords.every(coord => !isNaN(coord[0]) && !isNaN(coord[1]))) {
      const mapCoords = parsedCoords.map(coord => fromLonLat(coord));
      updateFeaturesFromCoordinates(mapCoords);
      calculateAngle(mapCoords);
    }
  }, [coordinates, updateFeaturesFromCoordinates, calculateAngle]);

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
  }, [map, isActive, updateFeaturesFromCoordinates, calculateAngle, setupMapInteractions]);

  const formatAngle = useCallback(() => {
    if (unit === 'radians') {
      return (angle * (Math.PI / 180)).toFixed(4) + ' rad';
    }
    return angle.toFixed(2) + '°';
  }, [angle, unit]);

  return {
    angle,
    unit,
    setUnit,
    coordinates,
    handleCoordinateChange,
    startNewMeasurement,
    formatAngle
  };
};
