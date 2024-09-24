import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Box, TextField } from '@mui/material';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { LineString, Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { FeatureLike } from 'ol/Feature';

interface AngleMeasurementProps {
  map: Map | null;
}

const AngleMeasurement: React.FC<AngleMeasurementProps> = ({ map }) => {
  const [measuring, setMeasuring] = useState<boolean>(false);
  const [angle, setAngle] = useState<number | null>(null);
  const [points, setPoints] = useState<Coordinate[]>([]);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  const createStyleFunction = (): (feature: FeatureLike) => Style[] => {
    return (feature: FeatureLike) => {
      const geometry = feature.getGeometry();
      if (geometry instanceof LineString) {
        return [new Style({
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 0.8)',
            width: 2,
          }),
        })];
      } else if (geometry instanceof Point) {
        return [new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
          }),
        })];
      }
      return [];
    };
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

    modify.on('modifyend', () => {
      updateMeasurement();
    });

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
      }
    };
  }, [map]);

  const updateMeasurement = () => {
    if (!vectorLayerRef.current) return;

    const features = vectorLayerRef.current.getSource()!.getFeatures();
    const pointFeatures = features.filter(f => f.getGeometry() instanceof Point);
    if (pointFeatures.length !== 3) return;

    const coordinates = pointFeatures.map(feature => {
      const geometry = feature.getGeometry() as Point;
      return transform(geometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
    });

    setPoints(coordinates);

    const angle = calculateAngle(coordinates[0], coordinates[1], coordinates[2]);
    setAngle(angle);

    drawLines(pointFeatures);
  };

  const drawLines = (pointFeatures: Feature[]) => {
    if (!vectorLayerRef.current) return;

    const source = vectorLayerRef.current.getSource()!;
    const lineFeatures = source.getFeatures().filter(f => f.getGeometry() instanceof LineString);
    lineFeatures.forEach(f => source.removeFeature(f));

    const lineString1 = new LineString([
      (pointFeatures[0].getGeometry() as Point).getCoordinates(),
      (pointFeatures[1].getGeometry() as Point).getCoordinates()
    ]);
    const lineString2 = new LineString([
      (pointFeatures[1].getGeometry() as Point).getCoordinates(),
      (pointFeatures[2].getGeometry() as Point).getCoordinates()
    ]);

    source.addFeature(new Feature(lineString1));
    source.addFeature(new Feature(lineString2));
  };

  const calculateAngle = (p1: Coordinate, p2: Coordinate, p3: Coordinate): number => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const angle1 = Math.atan2(y1 - y2, x1 - x2);
    const angle2 = Math.atan2(y3 - y2, x3 - x2);
    let angle = (angle2 - angle1) * (180 / Math.PI);

    if (angle < 0) {
      angle += 360;
    }

    return angle;
  };

  const startMeasurement = () => {
    if (!map || !vectorLayerRef.current) return;

    setMeasuring(true);
    setAngle(null);
    setPoints([]);

    const source = vectorLayerRef.current.getSource()!;
    source.clear();

    const draw = new Draw({
      source: source,
      type: 'Point',
      stopClick: true,
    });

    let pointCount = 0;

    draw.on('drawend', (event) => {
      pointCount++;
      const feature = event.feature;
      const geometry = feature.getGeometry() as Point;
      const coordinate = transform(geometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');
      
      setPoints(prevPoints => [...prevPoints, coordinate]);

      if (pointCount === 3) {
        updateMeasurement();
        setMeasuring(false);
        map.removeInteraction(draw);
      } else {
        // Draw temporary line
        if (pointCount === 2) {
          const prevFeature = source.getFeatures()[0];
          const prevGeometry = prevFeature.getGeometry() as Point;
          const lineString = new LineString([prevGeometry.getCoordinates(), geometry.getCoordinates()]);
          source.addFeature(new Feature(lineString));
        }
      }
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  };

  const stopMeasurement = () => {
    if (!map || !drawInteractionRef.current) return;

    map.removeInteraction(drawInteractionRef.current);
    setMeasuring(false);
    setPoints([]);
    setAngle(null);

    if (vectorLayerRef.current) {
      vectorLayerRef.current.getSource()!.clear();
    }
  };

  const handleInputMeasurement = (index: number, coord: 'lon' | 'lat', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newPoints = [...points];
    if (!newPoints[index]) {
      newPoints[index] = [0, 0];
    }
    newPoints[index] = [...newPoints[index]];
    newPoints[index][coord === 'lon' ? 0 : 1] = numValue;
    setPoints(newPoints);

    if (newPoints.length === 3 && newPoints.every(p => p.length === 2)) {
      if (!vectorLayerRef.current) return;
      const source = vectorLayerRef.current.getSource()!;
      source.clear();

      newPoints.forEach((point, i) => {
        const transformedPoint = transform(point, 'EPSG:4326', 'EPSG:3857');
        const feature = new Feature(new Point(transformedPoint));
        source.addFeature(feature);
      });

      updateMeasurement();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button 
        variant="contained" 
        onClick={startMeasurement}
        disabled={measuring}
      >
        Měření úhlu
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
      {angle !== null && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          Úhel: {angle.toFixed(2)}°
        </Typography>
      )}
      <Box sx={{ mt: 2 }}>
        {[0, 1, 2].map((index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <TextField
              label={`Bod ${index + 1} Lon`}
              type="number"
              value={points[index]?.[0].toFixed(6) || ''}
              onChange={(e) => handleInputMeasurement(index, 'lon', e.target.value)}
              size="small"
            />
            <TextField
              label={`Bod ${index + 1} Lat`}
              type="number"
              value={points[index]?.[1].toFixed(6) || ''}
              onChange={(e) => handleInputMeasurement(index, 'lat', e.target.value)}
              size="small"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default AngleMeasurement;