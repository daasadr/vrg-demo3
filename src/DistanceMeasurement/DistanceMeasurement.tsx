import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Box, TextField, Switch, FormControlLabel } from '@mui/material';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { LineString, Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { Feature } from 'ol';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { useMeasurement } from '../components/MeasurementContext';

interface DistanceMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

const DistanceMeasurement: React.FC<DistanceMeasurementProps> = ({ isActive, onActivate }) => {
  const { map, activeMeasurement, toggleMeasurement } = useMeasurement();
  const [measuring, setMeasuring] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [startLon, setStartLon] = useState<string>('');
  const [startLat, setStartLat] = useState<string>('');
  const [endLon, setEndLon] = useState<string>('');
  const [endLat, setEndLat] = useState<string>('');
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const coordinateOverlayRef = useRef<Overlay | null>(null);

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createStyleFunction(),
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    const modify = new Modify({ source: vectorSource });
    modifyInteractionRef.current = modify;
    map.addInteraction(modify);

    modify.on('modifyend', (evt) => {
      const features = evt.features.getArray();
      if (features.length > 0) {
        const feature = features[0];
        if (feature instanceof Feature && feature.getGeometry() instanceof LineString) {
          updateMeasurement(feature as Feature<LineString>);
        }
      }
    });

    const coordinateOverlay = new Overlay({
      element: document.createElement('div'),
      positioning: 'bottom-center',
      stopEvent: false,
    });
    coordinateOverlayRef.current = coordinateOverlay;
    map.addOverlay(coordinateOverlay);

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
        map.removeOverlay(coordinateOverlay);
      }
    };
  }, [map]);



  const createStyleFunction = () => {
    return (feature: any) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof LineString) {
        return new Style({
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 0.8)',
            width: 2,
          }),
        });
      } else if (geometry instanceof Point) {
        return new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
          }),
        });
      }
      return [];
    };
  };

  const updateMeasurement = useCallback((feature: Feature<LineString>) => {
    if (!feature) return;

    const line = feature.getGeometry();
    if (!(line instanceof LineString)) return;

    const length = getLength(line);
    setDistance(length / 1000); // Convert to kilometers

    const coordinates = line.getCoordinates();
    if (coordinates.length < 2) return;

    const start = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
    const end = transform(coordinates[coordinates.length - 1], 'EPSG:3857', 'EPSG:4326');

    setStartLon(start[0].toFixed(6));
    setStartLat(start[1].toFixed(6));
    setEndLon(end[0].toFixed(6));
    setEndLat(end[1].toFixed(6));
  }, []);

  const startMeasurement = useCallback(() => {
    if (!map || activeMeasurement !=='distance') {
      return;
    }

    setMeasuring(true);
    setDistance(null);
    setShowInput(true);

    const source = vectorLayerRef.current?.getSource();
    if (source) {
      source.clear();

      const draw = new Draw({
        source: source,
        type: 'LineString',
        maxPoints: 2,
      });

      draw.on('drawend', (event: any) => {
        const feature = event.feature as Feature<LineString>;
        updateMeasurement(feature);
        setMeasuring(false);
        map.removeInteraction(draw);
      });

      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    } else {
      console.error('Vector source is not available');
      setMeasuring(false);
    }
  }, [map, activeMeasurement]);

  useEffect(() => {
    if (activeMeasurement === 'distance') {
      startMeasurement();
    } else {
      stopMeasurement();
    }
  }, [activeMeasurement, startMeasurement]);


  const stopMeasurement = useCallback(() => {
    console.log('Stopping distance measurement');
    if (!map || !drawInteractionRef.current) return;

    map.removeInteraction(drawInteractionRef.current);
    setMeasuring(false);
    setShowInput(false);
    setStartLon('');
    setStartLat('');
    setEndLon('');
    setEndLat('');
    if (vectorLayerRef.current && vectorLayerRef.current.getSource()) {
      vectorLayerRef.current.getSource()!.clear();
    }
    setDistance(null);
  }, [map]);


  const handleInputMeasurement = () => {
    if (!map || !vectorLayerRef.current) return;

    const start = [parseFloat(startLon), parseFloat(startLat)];
    const end = [parseFloat(endLon), parseFloat(endLat)];

    if (start.some(isNaN) || end.some(isNaN)) {
      alert('Prosím zadejte platné souřadnice.');
      return;
    }

    const source = vectorLayerRef.current.getSource()!;
    source.clear();

    const startPoint = transform(start, 'EPSG:4326', 'EPSG:3857');
    const endPoint = transform(end, 'EPSG:4326', 'EPSG:3857');

    const lineFeature = new Feature(new LineString([startPoint, endPoint]));
    const startFeature = new Feature(new Point(startPoint));
    const endFeature = new Feature(new Point(endPoint));

    source.addFeatures([lineFeature, startFeature, endFeature]);
    updateMeasurement(lineFeature);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={() => toggleMeasurement('distance')}
        disabled={measuring}
      >
        {measuring ? 'Probíhá měření...' : 'Zahájit měření vzdálenosti'}
      </Button>
      {measuring && (
        <Button
          variant="outlined"
          onClick={stopMeasurement}
          sx={{ ml: 2 }}
        >
          Zrušit měření
        </Button>
      )}
      
      {distance !== null && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          Vzdálenost: {distance.toFixed(3)} km
        </Typography>
      )}
      {showInput && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Start - Zeměpisná délka"
            value={startLon}
            onChange={(e) => setStartLon(e.target.value)}
            size="small"
            sx={{ mr: 1, mb: 1 }}
          />
          <TextField
            label="Start - Zeměpisná šířka"
            value={startLat}
            onChange={(e) => setStartLat(e.target.value)}
            size="small"
            sx={{ mr: 1, mb: 1 }}
          />
          <TextField
            label="Konec - Zeměpisná délka"
            value={endLon}
            onChange={(e) => setEndLon(e.target.value)}
            size="small"
            sx={{ mr: 1, mb: 1 }}
          />
          <TextField
            label="Konec - Zeměpisná šířka"
            value={endLat}
            onChange={(e) => setEndLat(e.target.value)}
            size="small"
            sx={{ mr: 1, mb: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={handleInputMeasurement}
            sx={{ mt: 1 }}
          >
            Změřit zadané souřadnice
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DistanceMeasurement;