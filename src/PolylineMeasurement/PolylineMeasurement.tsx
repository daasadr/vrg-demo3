import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, TextField, Box, Typography } from '@mui/material';
import { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify } from 'ol/interaction';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { transform } from 'ol/proj';
import Feature from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { useMeasurement } from '../components/MeasurementContext';

interface PolylineMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

const PolylineMeasurement: React.FC<PolylineMeasurementProps> = ({ isActive, onActivate }) => {
  const { map, activeMeasurement, toggleMeasurement } = useMeasurement();
  const [source] = useState<VectorSource>(() => new VectorSource());
  const [measuring, setMeasuring] = useState<boolean>(false);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  // Initialize vector layer
  useEffect(() => {
    if (!map) return;

    const vectorLayer = new VectorLayer({
      source: source,
      style: createStyleFunction(),
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    // Add modify interaction
    const modify = new Modify({ source: source });
    modifyInteractionRef.current = modify;
    map.addInteraction(modify);

    modify.on('modifyend', () => {
      updateMeasurement();
    });

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
      }
    };
  }, [map, source]);

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

  const updateMeasurement = useCallback(() => {
    const features = source.getFeatures();
    const lineFeature = features.find(f => f.getGeometry() instanceof LineString);
    
    if (lineFeature) {
      const line = lineFeature.getGeometry() as LineString;
      const length = getLength(line);
      setTotalDistance(length / 1000); // Convert to kilometers

      // Update coordinates state with transformed coordinates
      const lineCoords = line.getCoordinates();
      const wgs84Coords = lineCoords.map(coord => 
        transform(coord, 'EPSG:3857', 'EPSG:4326')
      );
      setCoordinates(wgs84Coords);
    }
  }, [source]);

  const startMeasurement = useCallback(() => {
    if (!map || activeMeasurement !== 'polyline') {
      return;
    }

    setMeasuring(true);
    setTotalDistance(null);
    source.clear();

    const draw = new Draw({
      source: source,
      type: 'LineString',
      // Allow continuous drawing until double click
      condition: (event) => true,
    });

    draw.on('drawend', () => {
      updateMeasurement();
      setMeasuring(false);
      map.removeInteraction(draw);
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  }, [map, activeMeasurement, source, updateMeasurement]);

  useEffect(() => {
    if (activeMeasurement === 'polyline') {
      startMeasurement();
    } else {
      stopMeasurement();
    }
  }, [activeMeasurement, startMeasurement]);

  const stopMeasurement = useCallback(() => {
    if (!map || !drawInteractionRef.current) return;

    map.removeInteraction(drawInteractionRef.current);
    setMeasuring(false);
    source.clear();
    setTotalDistance(null);
    setCoordinates([]);
  }, [map, source]);

  const handleCoordinateChange = (index: number, type: 'lon' | 'lat', value: string) => {
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;

    const newCoordinates = [...coordinates];
    if (!newCoordinates[index]) {
      newCoordinates[index] = [0, 0];
    }
    newCoordinates[index][type === 'lon' ? 0 : 1] = newValue;
    setCoordinates(newCoordinates);

    // Update map features
    const mapCoords = newCoordinates.map(coord => 
      transform(coord, 'EPSG:4326', 'EPSG:3857')
    );

    source.clear();
    const lineFeature = new Feature(new LineString(mapCoords));
    source.addFeature(lineFeature);

    // Add point features
    mapCoords.forEach((coord) => {
      const pointFeature = new Feature(new Point(coord));
      source.addFeature(pointFeature);
    });

    updateMeasurement();
  };

  const addNewPoint = () => {
    setCoordinates([...coordinates, [0, 0]]);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        onClick={() => toggleMeasurement('polyline')}
        disabled={measuring}
      >
        {measuring ? 'Probíhá měření...' : 'Zahájit měření polyčárou'}
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
      
      {totalDistance !== null && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          Celková vzdálenost: {totalDistance.toFixed(3)} km
        </Typography>
      )}

      <Box sx={{ mt: 2 }}>
        {coordinates.map((coord, index) => (
          <Box key={index} sx={{ mt: 1 }}>
            <TextField
              label={`Bod ${index + 1} - Zeměpisná délka`}
              type="number"
              value={coord[0].toFixed(6)}
              onChange={(e) => handleCoordinateChange(index, 'lon', e.target.value)}
              size="small"
              sx={{ mr: 1 }}
            />
            <TextField
              label={`Bod ${index + 1} - Zeměpisná šířka`}
              type="number"
              value={coord[1].toFixed(6)}
              onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
              size="small"
            />
          </Box>
        ))}
        
        <Button
          variant="outlined"
          onClick={addNewPoint}
          sx={{ mt: 2 }}
        >
          Přidat další bod
        </Button>
      </Box>
    </Box>
  );
};

export default PolylineMeasurement;