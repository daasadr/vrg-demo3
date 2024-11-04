import React, { useState, useEffect, useCallback } from 'react';
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

const AngleMeasurement: React.FC<AngleMeasurementProps> = ({ isActive, onActivate }) => {
  const { map } = useMeasurement();
  const [source] = useState<VectorSource>(() => new VectorSource());
  const [vectorLayer] = useState<VectorLayer<VectorSource>>(() => 
    new VectorLayer({
      source: source,
      style: (feature) => {
        const geometry = feature.getGeometry();
        if (geometry instanceof LineString) {
          return new Style({
            stroke: new Stroke({
              color: 'red',
              width: 2
            })
          });
        } else if (geometry instanceof Point) {
          return new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color: 'blue'
              }),
              stroke: new Stroke({
                color: 'white',
                width: 2
              })
            })
          });
        }
      }
    })
  );
  
  const [angle, setAngle] = useState<number>(0);
  const [unit, setUnit] = useState<'degrees' | 'radians'>('degrees');
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [modifyInteraction, setModifyInteraction] = useState<Modify | null>(null);

  // Přidání/odebrání vrstvy při mount/unmount
  useEffect(() => {
    if (!map) return;
    map.addLayer(vectorLayer);
    return () => {
      map.removeLayer(vectorLayer);
    };
  }, [map, vectorLayer]);

  const updateFeaturesFromCoordinates = useCallback((mapCoords: Coordinate[]) => {
    source.clear();
    
    // Přidání line string feature pro čáry mezi body
    if (mapCoords.length >= 2) {
      const lineStringFeature = new Feature(new LineString(mapCoords));
      source.addFeature(lineStringFeature);
    }
    
    // Přidání bodových features
    mapCoords.forEach((coord, index) => {
      const pointFeature = new Feature(new Point(coord));
      pointFeature.set('pointIndex', index); // Přidáme index pro identifikaci bodu
      source.addFeature(pointFeature);
    });
  }, [source]);

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

  // Vytvoření a správa Draw interakce
  const createDrawInteraction = useCallback(() => {
    if (!map || !source) return null;

    const drawInteraction = new Draw({
      source: source,
      type: 'LineString',
      maxPoints: 3
    });

    drawInteraction.on('drawend', (event: any) => {
      const feature = event.feature;
      const geometry = feature.getGeometry() as LineString;
      const coords = geometry.getCoordinates();
      
      // Převedeme souřadnice na WGS84 pro zobrazení
      const wgs84Coords = coords.map(coord => toLonLat(coord));
      setCoordinates(wgs84Coords);
      
      // Aktualizujeme features a vypočítáme úhel
      updateFeaturesFromCoordinates(coords);
      calculateAngle(coords);
      
      setIsMeasuring(false);
      map.removeInteraction(drawInteraction);
    });

    return drawInteraction;
  }, [map, source, updateFeaturesFromCoordinates, calculateAngle]);

  // Vytvoření a správa Modify interakce
  const createModifyInteraction = useCallback(() => {
    if (!map || !source) return null;

    const modify = new Modify({
      source: source,
      // Přidáme specifický style pro zvýraznění aktivního bodu
      style: new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: 'yellow'
          }),
          stroke: new Stroke({
            color: 'red',
            width: 2
          })
        })
      })
    });

    modify.on('modifyend', () => {
      // Získáme všechny body v pořadí
      const points = source.getFeatures()
        .filter(f => f.getGeometry() instanceof Point)
        .sort((a, b) => (a.get('pointIndex') || 0) - (b.get('pointIndex') || 0))
        .map(f => (f.getGeometry() as Point).getCoordinates());

      if (points.length === 3) {
        // Aktualizujeme line string
        const lineStringFeature = source.getFeatures()
          .find(f => f.getGeometry() instanceof LineString);
        if (lineStringFeature) {
          (lineStringFeature.getGeometry() as LineString).setCoordinates(points);
        }

        // Aktualizujeme state s novými souřadnicemi
        const wgs84Coords = points.map(coord => toLonLat(coord));
        setCoordinates(wgs84Coords);
        calculateAngle(points);
      }
    });

    return modify;
  }, [map, source, calculateAngle]);

  // Řízení aktivního stavu měření
  useEffect(() => {
    if (!map) return;

    let drawInteraction: Draw | null = null;
    let modifyInteraction: Modify | null = null;

    if (isActive) {
      if (isMeasuring) {
        drawInteraction = createDrawInteraction();
        if (drawInteraction) map.addInteraction(drawInteraction);
      }
      
      // Vždy vytvoříme Modify interakci, když je komponenta aktivní
      modifyInteraction = createModifyInteraction();
      if (modifyInteraction) {
        map.addInteraction(modifyInteraction);
        setModifyInteraction(modifyInteraction);
      }
    }

    return () => {
      if (drawInteraction) map.removeInteraction(drawInteraction);
      if (modifyInteraction) {
        map.removeInteraction(modifyInteraction);
        setModifyInteraction(null);
      }
    };
  }, [map, isActive, isMeasuring, createDrawInteraction, createModifyInteraction]);

  const handleUnitChange = (event: SelectChangeEvent) => {
    setUnit(event.target.value as 'degrees' | 'radians');
  };

  const formatAngle = (): string => {
    if (unit === 'radians') {
      return (angle * (Math.PI / 180)).toFixed(4) + ' rad';
    }
    return angle.toFixed(2) + '°';
  };

  const startNewMeasurement = useCallback(() => {
    if (!isActive) {
      onActivate();
    }
    setIsMeasuring(true);
    setAngle(0);
    setCoordinates([]);
    source.clear();
  }, [isActive, onActivate, source]);

  const stopMeasurement = useCallback(() => {
    setIsMeasuring(false);
    setAngle(0);
    setCoordinates([]);
    source.clear();
  }, [source]);

  const handleCoordinateChange = (index: number, coord: 'lon' | 'lat', value: string) => {
    const newCoordinates = [...coordinates];
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    newCoordinates[index] = [...(newCoordinates[index] || [0, 0])];
    newCoordinates[index][coord === 'lon' ? 0 : 1] = newValue;
    setCoordinates(newCoordinates);
    
    // Převedeme souřadnice do formátu mapy a aktualizujeme features
    const mapCoords = newCoordinates.map(coord => fromLonLat(coord));
    updateFeaturesFromCoordinates(mapCoords);
    calculateAngle(mapCoords);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button 
        variant="contained" 
        onClick={startNewMeasurement}
        disabled={isMeasuring}
      >
        {isMeasuring ? 'Probíhá měření...' : 'Zahájit měření úhlu'}
      </Button>
      {isMeasuring && (
        <Button
          variant="outlined"
          onClick={stopMeasurement}
          sx={{ ml: 2 }}
        >
          Zrušit měření
        </Button>
      )}
      <FormControl sx={{ m: 1, minWidth: 120 }}>
        <InputLabel id="unit-select-label">Jednotky</InputLabel>
        <Select
          labelId="unit-select-label"
          id="unit-select"
          value={unit}
          label="Jednotky"
          onChange={handleUnitChange}
        >
          <MenuItem value="degrees">Stupně</MenuItem>
          <MenuItem value="radians">Radiány</MenuItem>
        </Select>
      </FormControl>
      {angle !== 0 && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          Změřený úhel: {formatAngle()}
        </Typography>
      )}
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
    </Box>
  );
};

export default AngleMeasurement;