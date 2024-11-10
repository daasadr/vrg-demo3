import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TextField, Box, Typography, IconButton, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
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

interface PointCoordinate {
  lon: string;
  lat: string;
}

const PolylineMeasurement: React.FC<PolylineMeasurementProps> = ({ isActive }) => {
  const { map, activeMeasurement } = useMeasurement();
  const [source] = useState<VectorSource>(() => new VectorSource());
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [points, setPoints] = useState<PointCoordinate[]>([]);
  const [unit, setUnit] = useState<'kilometers' | 'miles'>('kilometers');
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  const longitudeInputProps = {
    step: 0.01,
    min: -180,
    max: 180,
  };

  const latitudeInputProps = {
    step: 0.01,
    min: -90,
    max: 90,
  };

  const convertDistance = useCallback((distanceInKm: number): number => {
    return unit === 'kilometers' ? distanceInKm : distanceInKm * 0.621371;
  }, [unit]);

  const createStyleFunction = useCallback(() => {
    return new Style({
      stroke: new Stroke({
        color: 'rgba(255, 0, 0, 0.8)',
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: 'red' }),
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
        lon: coord[0].toFixed(2),
        lat: coord[1].toFixed(2)
      })));
    }
  }, [source, convertDistance]);

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

      const lineFeature = new Feature(new LineString(mapCoords));
      source.addFeature(lineFeature);

      mapCoords.forEach((coord) => {
        const pointFeature = new Feature(new Point(coord));
        source.addFeature(pointFeature);
      });

      const geometry = lineFeature.getGeometry() as LineString;
      const length = getLength(geometry) / 1000;
      setTotalDistance(convertDistance(length));
    } else {
      setTotalDistance(null);
    }
  }, [points, source, convertDistance]);

  const initializeInteractions = useCallback(() => {
    if (!map) return;

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }

    const draw = new Draw({
      source: source,
      type: 'LineString',
      style: createStyleFunction(),
    });

    map.getInteractions().forEach((interaction) => {
      if (interaction.get('type') === 'doubleclick-zoom') {
        interaction.setActive(false);
      }
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
      });
      modify.on('modifyend', () => {
        const features = source.getFeatures();
        const lineFeature = features.find(f => f.getGeometry() instanceof LineString);
        if (lineFeature) {
          updateMeasurement(lineFeature.getGeometry() as LineString);
        }
      });
      map.addInteraction(modify);
      modifyInteractionRef.current = modify;
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  }, [map, source, createStyleFunction, updateMeasurement]);

  const handleCoordinateChange = (index: number, field: 'lon' | 'lat', value: string) => {
    const newPoints = [...points];
    newPoints[index] = {
      ...newPoints[index],
      [field]: value
    };
    setPoints(newPoints);
  };

  const handleUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: 'kilometers' | 'miles') => {
    if (newUnit !== null) {
      setUnit(newUnit);
    }
  };

  const addNewPoint = () => {
    setPoints([...points, { lon: '', lat: '' }]);
  };

  const removePoint = (index: number) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
  };

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
        map.getInteractions().forEach((interaction) => {
          if (interaction.get('type') === 'doubleclick-zoom') {
            interaction.setActive(true);
          }
        });

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
  }, [map, activeMeasurement, source, createStyleFunction, initializeInteractions]);

  useEffect(() => {
    updateMapFeatures();
  }, [points, updateMapFeatures]);

  return (
    <Box sx={{ mt: 2 }}>
      {totalDistance !== null && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Celková vzdálenost: {totalDistance.toFixed(2)} {unit === 'kilometers' ? 'km' : 'mi'}
        </Typography>
      )}
      
      <ToggleButtonGroup
        value={unit}
        exclusive
        onChange={handleUnitChange}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="kilometers">km</ToggleButton>
        <ToggleButton value="miles">mi</ToggleButton>
      </ToggleButtonGroup>

      <Box>
        {points.map((point, index) => (
          <Box key={index} sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <TextField
              label={`Bod ${index + 1} - Zeměpisná délka`}
              value={point.lon}
              onChange={(e) => handleCoordinateChange(index, 'lon', e.target.value)}
              type="number"
              inputProps={longitudeInputProps}
              size="small"
              sx={{ width: '180px', mr: 1 }}
            />
            <TextField
              label={`Bod ${index + 1} - Zeměpisná šířka`}
              value={point.lat}
              onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
              type="number"
              inputProps={latitudeInputProps}
              size="small"
              sx={{ width: '180px', mr: 1 }}
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