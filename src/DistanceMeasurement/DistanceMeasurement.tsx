import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Typography, Box, TextField, Select, MenuItem } from '@mui/material';
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

type DistanceUnit = 'km' | 'mi';

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
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const coordinateOverlayRef = useRef<Overlay | null>(null);

  const convertDistance = (distanceInKm: number, targetUnit: DistanceUnit): number => {
    return targetUnit === 'km' ? distanceInKm : distanceInKm * 0.621371;
  };

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
    setDistance(length / 1000); // Store in kilometers

    const coordinates = line.getCoordinates();
    if (coordinates.length < 2) return;

    const start = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
    const end = transform(coordinates[coordinates.length - 1], 'EPSG:3857', 'EPSG:4326');

    setStartLon(start[0].toFixed(2));
    setStartLat(start[1].toFixed(2));
    setEndLon(end[0].toFixed(2));
    setEndLat(end[1].toFixed(2));
  }, []);

  const startMeasurement = useCallback(() => {
    if (!map || activeMeasurement !== 'distance') return;

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
    }
  }, [map, activeMeasurement, updateMeasurement]);

  useEffect(() => {
    if (activeMeasurement === 'distance') {
      startMeasurement();
    }
  }, [activeMeasurement, startMeasurement]);

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

  // Pomocné konstanty pro inputy
  const inputProps = {
    step: 0.01,  // Krok po setinách stupně
    min: -180,   // Minimální hodnota pro délku
    max: 180,    // Maximální hodnota pro délku
  };

  const latitudeInputProps = {
    ...inputProps,
    min: -90,    // Minimální hodnota pro šířku
    max: 90,     // Maximální hodnota pro šířku
  };

  return (
    <Box sx={{ mt: 2 }}>
      {distance !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Typography variant="body1">
            Vzdálenost: {convertDistance(distance, unit).toFixed(3)} {unit === 'km' ? 'km' : 'mi'}
          </Typography>
          <Select
            value={unit}
            onChange={(e) => setUnit(e.target.value as DistanceUnit)}
            size="small"
            sx={{ ml: 2, minWidth: 100 }}
          >
            <MenuItem value="km">Kilometry</MenuItem>
            <MenuItem value="mi">Míle</MenuItem>
          </Select>
        </Box>
      )}
      <Box sx={{ mt: 2 }}>
        <TextField
          label="Start - Zeměpisná délka"
          value={startLon}
          onChange={(e) => setStartLon(e.target.value)}
          type="number"
          inputProps={inputProps}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        <TextField
          label="Start - Zeměpisná šířka"
          value={startLat}
          onChange={(e) => setStartLat(e.target.value)}
          type="number"
          inputProps={latitudeInputProps}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        <TextField
          label="Konec - Zeměpisná délka"
          value={endLon}
          onChange={(e) => setEndLon(e.target.value)}
          type="number"
          inputProps={inputProps}
          size="small"
          sx={{ mr: 1, mb: 1 }}
        />
        <TextField
          label="Konec - Zeměpisná šířka"
          value={endLat}
          onChange={(e) => setEndLat(e.target.value)}
          type="number"
          inputProps={latitudeInputProps}
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
    </Box>
  );
};

export default DistanceMeasurement;