import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Box } from '@mui/material';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw  from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { LineString, Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { Feature, Collection } from 'ol';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import { StyleLike, StyleFunction } from 'ol/style/Style';
import { FeatureLike } from 'ol/Feature';
import { DrawEvent } from 'ol/interaction/Draw';


interface DistanceMeasurementProps {
  map: Map | null;
}

const DistanceMeasurement: React.FC<DistanceMeasurementProps> = ({ map }) => {
  const [measuring, setMeasuring] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [azimuth, setAzimuth] = useState<number | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  const createStyleFunction = (): StyleFunction => {
    return (feature: FeatureLike) => {
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

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createStyleFunction()
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    const modify = new Modify({ source: vectorSource });
    modifyInteractionRef.current = modify;
    map.addInteraction(modify);

    modify.on('modifyend', updateMeasurement);

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
      }
    };
  }, [map]);

  const updateMeasurement = (event: { features: Collection<Feature> }) => {
    const features = event.features.getArray();
    if (features.length === 0) return;

    const line = features[0].getGeometry() as LineString;
    const length = getLength(line, { projection: 'EPSG:3857' });
    setDistance(length);

    const coordinates = line.getCoordinates();
    const start = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
    const end = transform(coordinates[1], 'EPSG:3857', 'EPSG:4326');
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) {
      angle += 360;
    }
    setAzimuth(angle);
  };

  const startMeasurement = () => {
    if (!map || !vectorLayerRef.current) return;

    setMeasuring(true);
    setDistance(null);
    setAzimuth(null);

    const source = vectorLayerRef.current.getSource()!;
    source.clear();

    const draw = new Draw({
      source: source,
      type: 'LineString',
      maxPoints: 2,
    });

    draw.on('drawend', (event: DrawEvent) => {
      const feature = event.feature as Feature<LineString>;
      updateMeasurement({ features: new Collection([feature]) });
      setMeasuring(false);
      map.removeInteraction(draw);
    });

    map.addInteraction(draw);
    drawInteractionRef.current = draw;
  };

  const stopMeasurement = () => {
    if (!map || !drawInteractionRef.current) return;

    map.removeInteraction(drawInteractionRef.current);
    setMeasuring(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button 
        variant="contained" 
        onClick={startMeasurement}
        disabled={measuring}
      >
        Měření přímé vzdálenosti
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
          Vzdálenost: {distance.toFixed(2)} m ({(distance / 1000).toFixed(2)} km)
        </Typography>
      )}
      {azimuth !== null && (
        <Typography variant="body1">
          Azimut: {azimuth.toFixed(2)}°
        </Typography>
      )}
    </Box>
  );
}

export default DistanceMeasurement;