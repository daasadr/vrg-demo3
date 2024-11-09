import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify } from 'ol/interaction';
import { Style, Stroke, Circle, Fill } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography, SelectChangeEvent } from '@mui/material';
import { useMeasurement } from '../components/MeasurementContext';

interface AngleMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

const AngleMeasurement: React.FC<AngleMeasurementProps> = ({ isActive }) => {
  const { map } = useMeasurement();
  const sourceRef = useRef<VectorSource>(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<VectorSource>>(
    new VectorLayer({
      source: sourceRef.current,
      style: function(feature) {
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

  // Konstanty pro vstupy
  const inputProps = {
    step: 0.01,
    min: -180,
    max: 180,
  };

  const latitudeInputProps = {
    ...inputProps,
    min: -90,
    max: 90,
  };

  useEffect(() => {
    if (!map) return;
    map.addLayer(vectorLayerRef.current);
    return () => {
      map.removeLayer(vectorLayerRef.current);
    };
  }, [map]);

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

    const draw = new Draw({
      source: sourceRef.current,
      type: 'LineString',
      maxPoints: 3
    });

    draw.on('drawend', (event: any) => {
      const feature = event.feature;
      const geometry = feature.getGeometry() as LineString;
      const coords = geometry.getCoordinates();
      
      const wgs84Coords = coords.map(coord => toLonLat(coord));
      setCoordinates(wgs84Coords.map(coord => [coord[0].toFixed(2), coord[1].toFixed(2)]));
      
      updateFeaturesFromCoordinates(coords);
      calculateAngle(coords);
      
      map.removeInteraction(draw);
      map.addInteraction(draw);
    });

    map.addInteraction(draw);

    const modify = new Modify({
      source: sourceRef.current
    });

    modify.on('modifyend', () => {
      const points = sourceRef.current.getFeatures()
        .filter(f => f.getGeometry() instanceof Point)
        .sort((a, b) => (a.get('pointIndex') || 0) - (b.get('pointIndex') || 0))
        .map(f => (f.getGeometry() as Point).getCoordinates());

      if (points.length === 3) {
        const wgs84Coords = points.map(coord => toLonLat(coord));
        setCoordinates(wgs84Coords.map(coord => [coord[0].toFixed(2), coord[1].toFixed(2)]));
        calculateAngle(points);
      }
    });

    map.addInteraction(modify);

    return () => {
      map.removeInteraction(draw);
      map.removeInteraction(modify);
    };
  }, [map, isActive, updateFeaturesFromCoordinates, calculateAngle]);

  const handleUnitChange = (event: SelectChangeEvent<string>) => {
    setUnit(event.target.value as 'degrees' | 'radians');
  };

  const formatAngle = (): string => {
    if (unit === 'radians') {
      return (angle * (Math.PI / 180)).toFixed(4) + ' rad';
    }
    return angle.toFixed(2) + '°';
  };

  const handleCoordinateChange = (index: number, type: 'lon' | 'lat', value: string) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index] = [...newCoordinates[index]];
    newCoordinates[index][type === 'lon' ? 0 : 1] = value;
    setCoordinates(newCoordinates);
  };

  const measureFromCoordinates = () => {
    const parsedCoords = coordinates.map(coord => [
      parseFloat(coord[0]) || 0,
      parseFloat(coord[1]) || 0
    ]);

    if (parsedCoords.length === 3) {
      const mapCoords = parsedCoords.map(coord => fromLonLat(coord));
      updateFeaturesFromCoordinates(mapCoords);
      calculateAngle(mapCoords);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="unit-select-label">Jednotky</InputLabel>
          <Select
            labelId="unit-select-label"
            id="unit-select"
            value={unit}
            label="Jednotky"
            onChange={handleUnitChange}
            size="small"
          >
            <MenuItem value="degrees">Stupně</MenuItem>
            <MenuItem value="radians">Radiány</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {angle !== 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Změřený úhel: {formatAngle()}
        </Typography>
      )}

      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Souřadnice bodů (WGS84):
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[0, 1, 2].map((index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label={`Bod ${index + 1} - Zeměpisná délka`}
              type="number"
              value={coordinates[index][0]}
              onChange={(e) => handleCoordinateChange(index, 'lon', e.target.value)}
              inputProps={inputProps}
              variant="outlined"
              size="small"
              sx={{ width: '180px' }}
            />
            <TextField
              label={`Bod ${index + 1} - Zeměpisná šířka`}
              type="number"
              value={coordinates[index][1]}
              onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
              inputProps={latitudeInputProps}
              variant="outlined"
              size="small"
              sx={{ width: '180px' }}
            />
          </Box>
        ))}
      </Box>

      <Button 
        variant="contained"
        onClick={measureFromCoordinates}
        sx={{ mt: 3 }}
      >
        Změřit zadané souřadnice
      </Button>
    </Box>
  );
};

export default AngleMeasurement;