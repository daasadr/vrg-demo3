import { useState, useCallback, useRef, useEffect } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import { LineString, Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';
import { MeasurementUnit, PointCoordinate, UsePolylineMeasurementReturn } from '../types/polyline.types';
import { never } from 'ol/events/condition';

export const usePolylineMeasurement = (): UsePolylineMeasurementReturn => {
  const { map, activeMeasurement } = useMeasurement();
  const [source] = useState<VectorSource>(() => new VectorSource());
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [points, setPoints] = useState<PointCoordinate[]>([]);
  const [unit, setUnit] = useState<MeasurementUnit>('kilometers');
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);
  const doubleClickZoomRef = useRef<any>(null);

  const convertDistance = useCallback((distanceInKm: number): number => {
    return unit === 'kilometers' ? distanceInKm : distanceInKm * 0.621371;
  }, [unit]);

  const createStyleFunction = useCallback(() => {
    return new Style({
      stroke: new Stroke({
        color: 'rgba(255, 0, 0, 0.8)',
        width: 2,
        lineDash: undefined,
      }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
        stroke: new Stroke({ color: 'white', width: 2 }),
      }),
    });
  }, []);

  const updateMeasurement = useCallback((geometry?: LineString) => {
    if (!geometry && source) {
      const features = source.getFeatures();
      const lineFeature = features.find(f => f.getGeometry() instanceof LineString);
      if (lineFeature) {
        geometry = lineFeature.getGeometry() as LineString;
      }
    }
    
    if (geometry) {
      const length = getLength(geometry) / 1000;
      setTotalDistance(convertDistance(length));

      const lineCoords = geometry.getCoordinates();
      const wgs84Coords = lineCoords.map(coord => 
        transform(coord, 'EPSG:3857', 'EPSG:4326')
      );
      
      setPoints(wgs84Coords.map(coord => ({
        lon: coord[0].toFixed(6),
        lat: coord[1].toFixed(6)
      })));
    }
  }, [source, convertDistance]);

  const disableDoubleClickZoom = useCallback(() => {
    if (!map) return;
    
    map.getInteractions().forEach((interaction) => {
      if (interaction.get('type') === 'doubleclick-zoom') {
        doubleClickZoomRef.current = interaction;
        interaction.setActive(false);
      }
    });
  }, [map]);

  const enableDoubleClickZoom = useCallback(() => {
    if (doubleClickZoomRef.current) {
      doubleClickZoomRef.current.setActive(true);
      doubleClickZoomRef.current = null;
    }
  }, []);

  const initializeInteractions = useCallback(() => {
    if (!map) return;

    // Clean up existing interactions
    [drawInteractionRef, modifyInteractionRef, snapInteractionRef].forEach(ref => {
      if (ref.current) {
        map.removeInteraction(ref.current);
        ref.current = null;
      }
    });

    const draw = new Draw({
      source: source,
      type: 'LineString',
      style: createStyleFunction(),
      maxPoints: 50, // Limit maximum points to prevent performance issues
      freehand: false,
      stopClick: false,
      condition: (event) => {
        return event.originalEvent.button === 0; // Only left mouse button
      },
    });

    disableDoubleClickZoom();

    const snap = new Snap({
      source: source,
      pixelTolerance: 10,
    });

    draw.on('drawstart', (event) => {
      source.clear();
      setPoints([]);
      const feature = event.feature;
      
      const geometry = feature.getGeometry();
      if (geometry) {
        geometry.on('change', (e) => {
          const geom = e.target;
          if (geom instanceof LineString) {
            updateMeasurement(geom);
          }
        });
      }
    });

    draw.on('drawend', () => {
      map.removeInteraction(draw);
      
      const modify = new Modify({
      source: source,
      style: createStyleFunction(),
      pixelTolerance: 10,
      deleteCondition: never 
     });
      
      modify.on('modifystart', () => {
        disableDoubleClickZoom();
      });
      
      modify.on('modifyend', () => {
        const features = source.getFeatures();
        const lineFeature = features.find(f => f.getGeometry() instanceof LineString);
        if (lineFeature) {
          updateMeasurement(lineFeature.getGeometry() as LineString);
        }
        enableDoubleClickZoom();
      });

      map.addInteraction(modify);
      modifyInteractionRef.current = modify;
      enableDoubleClickZoom();
    });

    map.addInteraction(draw);
    map.addInteraction(snap);
    
    drawInteractionRef.current = draw;
    snapInteractionRef.current = snap;

  }, [map, source, createStyleFunction, updateMeasurement, disableDoubleClickZoom, enableDoubleClickZoom]);

  const startNewMeasurement = useCallback(() => {
    source.clear();
    setTotalDistance(null);
    setPoints([]);
    
    if (map && activeMeasurement === 'polyline') {
      if (modifyInteractionRef.current) {
        map.removeInteraction(modifyInteractionRef.current);
        modifyInteractionRef.current = null;
      }
      initializeInteractions();
    }
  }, [map, activeMeasurement, source, initializeInteractions]);

  useEffect(() => {
    if (!map || !activeMeasurement) return;

    if (activeMeasurement === 'polyline') {
      if (!vectorLayerRef.current) {
        const vectorLayer = new VectorLayer({
          source: source,
          style: createStyleFunction(),
          zIndex: 1,
        });
        vectorLayerRef.current = vectorLayer;
        map.addLayer(vectorLayer);
      }
      initializeInteractions();
    }

    return () => {
      if (map) {
        enableDoubleClickZoom();

        if (vectorLayerRef.current) {
          map.removeLayer(vectorLayerRef.current);
          vectorLayerRef.current = null;
        }
        if (drawInteractionRef.current) {
          map.removeInteraction(drawInteractionRef.current);
          drawInteractionRef.current = null;
        }
        if (modifyInteractionRef.current) {
          map.removeInteraction(modifyInteractionRef.current);
          modifyInteractionRef.current = null;
        }
      }
    };
  }, [map, activeMeasurement, source, createStyleFunction, initializeInteractions, ]);
  
  const updateMapFeatures = useCallback(() => {
  source.clear();
  
  const validPoints = points.filter(p => 
    p.lon !== '' && p.lat !== '' && 
    !isNaN(Number(p.lon)) && !isNaN(Number(p.lat))
  );

  if (validPoints.length > 1) {
    const mapCoords = validPoints.map(point => 
      transform([Number(point.lon), Number(point.lat)], 'EPSG:4326', 'EPSG:3857')
    );

    // Add line feature
    const lineFeature = new Feature(new LineString(mapCoords));
    lineFeature.setStyle(createStyleFunction());
    source.addFeature(lineFeature);

    // Add point features
    mapCoords.forEach((coord) => {
      const pointFeature = new Feature(new Point(coord));
      pointFeature.setStyle(createStyleFunction());
      source.addFeature(pointFeature);
    });

    const geometry = lineFeature.getGeometry() as LineString;
    const length = getLength(geometry) / 1000;
    setTotalDistance(convertDistance(length));
  } else {
    setTotalDistance(null);
  }
}, [points, source, createStyleFunction, convertDistance]);

  useEffect(() => {
    updateMapFeatures();
  }, [points, updateMapFeatures]);

  const handleUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: MeasurementUnit) => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const handleCoordinateChange = (index: number, field: 'lon' | 'lat', value: string) => {
    const newPoints = [...points];
    newPoints[index] = {
      ...newPoints[index],
      [field]: value
    };
    setPoints(newPoints);
  };

  const addNewPoint = () => {
    setPoints([...points, { lon: '', lat: '' }]);
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
  };

  return {
    source,
    totalDistance,
    points,
    unit,
    vectorLayerRef,
    drawInteractionRef,
    modifyInteractionRef,
    handleUnitChange,
    handleCoordinateChange,
    addNewPoint,
    removePoint,
    startNewMeasurement
  };
};