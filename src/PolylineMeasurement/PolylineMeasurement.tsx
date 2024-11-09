import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, TextField, Box, Typography, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
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
import CloseIcon from '@mui/icons-material/Close';

interface PolylineMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

interface CoordinateInput {
  lon: string;
  lat: string;
}

const PolylineMeasurement: React.FC<PolylineMeasurementProps> = ({ isActive }) => {
  const { map, activeMeasurement } = useMeasurement();
  const [source] = useState<VectorSource>(() => new VectorSource());
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [inputValues, setInputValues] = useState<CoordinateInput[]>([]);
  const [unit, setUnit] = useState<'kilometers' | 'miles'>('kilometers');
  const [isDrawing, setIsDrawing] = useState(false);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  const convertDistance = (distanceInKm: number): number => {
    return unit === 'kilometers' ? distanceInKm : distanceInKm * 0.621371;
  };

  useEffect(() => {
    // Update input values when coordinates change, with 2 decimal places
    setInputValues(coordinates.map(coord => ({
      lon: coord[0].toFixed(2),
      lat: coord[1].toFixed(2)
    })));
  }, [coordinates]);

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

  const initializeDrawInteraction = useCallback(() => {
    if (!map) return;

    const draw = new Draw({
      source: source,
      type: 'LineString',
    });

    // Set drawing state and measure during drawing
    draw.on('drawstart', (evt) => {
      setIsDrawing(true);
      const drawEvent = evt as any;
      const sketch = drawEvent.feature;

      sketch.getGeometry().on('change', (e: any) => {
        const line = e.target;
        const length = getLength(line) / 1000;
        setCurrentDistance(convertDistance(length));
      });
    });

    draw.on('drawend', (evt) => {
      setIsDrawing(false);
      const feature = evt.feature;
      const geometry = feature.getGeometry() as LineString;
      const length = getLength(geometry) / 1000;
      setTotalDistance(convertDistance(length));
      setCurrentDistance(null);

      // Update coordinates
      const lineCoords = geometry.getCoordinates();
      const wgs84Coords = lineCoords.map(coord => 
        transform(coord, 'EPSG:3857', 'EPSG:4326')
      );
      setCoordinates(wgs84Coords);

      // Remove draw interaction after completion
      if (map && drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  }, [map, source, convertDistance]);

  useEffect(() => {
    if (!map) return;

    const vectorLayer = new VectorLayer({
      source: source,
      style: createStyleFunction(),
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    const modify = new Modify({ source: source });
    modifyInteractionRef.current = modify;
    map.addInteraction(modify);

    modify.on('modifyend', updateMeasurement);

    if (activeMeasurement === 'polyline' && !isDrawing) {
      initializeDrawInteraction();
    }

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
        if (drawInteractionRef.current) {
          map.removeInteraction(drawInteractionRef.current);
        }
      }
    };
  }, [map, source, activeMeasurement, isDrawing, initializeDrawInteraction]);

  const updateMeasurement = useCallback(() => {
    const features = source.getFeatures();
    const lineFeature = features.find(f => f.getGeometry() instanceof LineString);
    
    if (lineFeature) {
      const line = lineFeature.getGeometry() as LineString;
      const length = getLength(line) / 1000;
      setTotalDistance(convertDistance(length));

      const lineCoords = line.getCoordinates();
      const wgs84Coords = lineCoords.map(coord => 
        transform(coord, 'EPSG:3857', 'EPSG:4326')
      );
      setCoordinates(wgs84Coords);
    }
  }, [source, convertDistance]);

  const handleCoordinateChange = (index: number, type: 'lon' | 'lat', value: string) => {
    // Allow empty string for clearing input
    if (value === '') {
      const newInputValues = [...inputValues];
      newInputValues[index] = {
        ...newInputValues[index],
        [type]: ''
      };
      setInputValues(newInputValues);
      return;
    }

    // Only allow numeric input with up to 2 decimal places
    const regex = /^-?\d*\.?\d{0,2}$/;
    if (!regex.test(value)) return;

    const newInputValues = [...inputValues];
    newInputValues[index] = {
      ...newInputValues[index],
      [type]: value
    };
    setInputValues(newInputValues);

    // Update coordinates only if value is a valid number
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) {
      const newCoordinates = [...coordinates];
      if (!newCoordinates[index]) {
        newCoordinates[index] = [0, 0];
      }
      newCoordinates[index][type === 'lon' ? 0 : 1] = parsedValue;
      setCoordinates(newCoordinates);
      updateMapFeatures(newCoordinates);
    }
  };

  const updateMapFeatures = (coords: Coordinate[]) => {
    source.clear();
    
    if (coords.length > 0) {
      const mapCoords = coords.map(coord => 
        transform(coord, 'EPSG:4326', 'EPSG:3857')
      );

      const lineFeature = new Feature(new LineString(mapCoords));
      source.addFeature(lineFeature);

      mapCoords.forEach((coord) => {
        const pointFeature = new Feature(new Point(coord));
        source.addFeature(pointFeature);
      });

      updateMeasurement();
    } else {
      setTotalDistance(null);
      setCurrentDistance(null);
    }
  };

  const handleUnitChange = (event: React.MouseEvent<HTMLElement>, newUnit: 'kilometers' | 'miles') => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const addNewPoint = () => {
    setCoordinates([...coordinates, [0, 0]]);
    setInputValues([...inputValues, { lon: '0.00', lat: '0.00' }]);
  };

  const removePoint = (index: number) => {
    const newCoordinates = coordinates.filter((_, i) => i !== index);
    const newInputValues = inputValues.filter((_, i) => i !== index);
    setCoordinates(newCoordinates);
    setInputValues(newInputValues);
    updateMapFeatures(newCoordinates);
  };

  // Restart drawing
  const startNewMeasurement = () => {
    source.clear();
    setTotalDistance(null);
    setCurrentDistance(null);
    setCoordinates([]);
    setInputValues([]);
    if (!isDrawing) {
      initializeDrawInteraction();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <ToggleButtonGroup
          value={unit}
          exclusive
          onChange={handleUnitChange}
          size="small"
        >
          <ToggleButton value="kilometers">Kilometry</ToggleButton>
          <ToggleButton value="miles">Míle</ToggleButton>
        </ToggleButtonGroup>
        
        {currentDistance !== null && (
          <Typography variant="body1">
            Průběžná vzdálenost: {currentDistance.toFixed(2)} {unit === 'kilometers' ? 'km' : 'mi'}
          </Typography>
        )}
        
        {totalDistance !== null && (
          <Typography variant="body1">
            Celková vzdálenost: {totalDistance.toFixed(2)} {unit === 'kilometers' ? 'km' : 'mi'}
          </Typography>
        )}

        {!isDrawing && (
          <Button 
            variant="contained" 
            onClick={startNewMeasurement}
            size="small"
          >
            Nové měření
          </Button>
        )}
      </Box>

      <Box>
        {coordinates.map((_, index) => (
          <Box key={index} sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <TextField
              label={`Bod ${index + 1} - Zeměpisná délka`}
              value={inputValues[index]?.lon || ''}
              onChange={(e) => handleCoordinateChange(index, 'lon', e.target.value)}
              inputProps={{ 
                type: 'number',
                step: "0.01",
                style: { width: '150px' }
              }}
              size="small"
              sx={{ mr: 1 }}
            />
            <TextField
              label={`Bod ${index + 1} - Zeměpisná šířka`}
              value={inputValues[index]?.lat || ''}
              onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
              inputProps={{ 
                type: 'number',
                step: "0.01",
                style: { width: '150px' }
              }}
              size="small"
            />
            <IconButton
              onClick={() => removePoint(index)}
              size="small"
              sx={{ ml: 1 }}
              aria-label={`Odstranit bod ${index + 1}`}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ))}
        
        <Button
          variant="outlined"
          onClick={addNewPoint}
          sx={{ mt: 2 }}
        >
          Přidat bod
        </Button>
      </Box>
    </Box>
  );
};

export default PolylineMeasurement;