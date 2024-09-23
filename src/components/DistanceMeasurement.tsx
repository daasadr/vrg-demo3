import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Box, TextField, Switch, FormControlLabel } from '@mui/material';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import { LineString, Point } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { Feature, Collection } from 'ol';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import { FeatureLike } from 'ol/Feature';
import { DrawEvent } from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';

interface DistanceMeasurementProps {
  map: Map | null;
}

const DistanceMeasurement: React.FC<DistanceMeasurementProps> = ({ map }) => {
  const [measuring, setMeasuring] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [azimuth, setAzimuth] = useState<number | null>(null);
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

  const createStyleFunction = () => {
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
      style: createStyleFunction(),
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    const modify = new Modify({ source: vectorSource });
    modifyInteractionRef.current = modify;
    map.addInteraction(modify);

 modify.on('modifyend', (evt) => {
  try {
    const features = evt.features.getArray();
    if (features.length > 0) {
      const feature = features[0];
      if (feature instanceof Feature && feature.getGeometry() instanceof LineString) {
        updateMeasurement(feature as Feature<LineString>);
      }
    }
  } catch (error) {
    console.error('Error during modify event:', error);
     setMeasuring(false);
    setDistance(null);
    setAzimuth(null);
    setShowInput(false);
    setStartLon('');
    setStartLat('');
    setEndLon('');
    setEndLat('');
    if (vectorLayerRef.current && vectorLayerRef.current.getSource()) {
      vectorLayerRef.current.getSource()!.clear();
    }
    alert('Došlo k chybě při měření. Měření bylo resetováno.');
  }
});

    // Create coordinate overlay
    const coordinateOverlay = new Overlay({
      element: document.createElement('div'),
      positioning: 'bottom-center',
      stopEvent: false,
    });
    coordinateOverlayRef.current = coordinateOverlay;
    map.addOverlay(coordinateOverlay);

       // Funkce pro aktualizaci zobrazení souřadnic
    const updateCoordinateDisplay = (evt: any) => {
      if (showCoordinates && coordinateOverlayRef.current) {
        const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
        coordinateOverlayRef.current.setPosition(evt.coordinate);
        coordinateOverlayRef.current.getElement()!.innerHTML = `${coordinate[0].toFixed(6)}, ${coordinate[1].toFixed(6)}`;
      } else if (coordinateOverlayRef.current) {
        coordinateOverlayRef.current.setPosition(undefined);
      }
    };

    // Přidání/odebrání posluchače událostí pro zobrazení souřadnic
    const toggleCoordinateDisplay = () => {
      if (showCoordinates) {
        map.on('pointermove', updateCoordinateDisplay);
      } else {
        map.un('pointermove', updateCoordinateDisplay);
        if (coordinateOverlayRef.current) {
          coordinateOverlayRef.current.setPosition(undefined);
        }
      }
    };

    toggleCoordinateDisplay();

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
        map.removeInteraction(modify);
        map.un('pointermove', updateCoordinateDisplay);
        map.removeOverlay(coordinateOverlay);
      }
    };
  }, [map]);

  useEffect(() => {
    if (map) {
      const updateCoordinateDisplay = (evt: any) => {
        if (showCoordinates && coordinateOverlayRef.current) {
          const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
          coordinateOverlayRef.current.setPosition(evt.coordinate);
          coordinateOverlayRef.current.getElement()!.innerHTML = `${coordinate[0].toFixed(6)}, ${coordinate[1].toFixed(6)}`;
        } else if (coordinateOverlayRef.current) {
          coordinateOverlayRef.current.setPosition(undefined);
        }
      };

      if (showCoordinates) {
        map.on('pointermove', updateCoordinateDisplay);
      } else {
        map.un('pointermove', updateCoordinateDisplay);
        if (coordinateOverlayRef.current) {
          coordinateOverlayRef.current.setPosition(undefined);
        }
      }
    }
  }, [map, showCoordinates]);

  const updateMeasurement = (feature: Feature<LineString>) => {
    if (!feature) return;

    const line = feature.getGeometry();
  if (!(line instanceof LineString)) return;

    const length = getLength(line);
    setDistance(length / 1000); // Convert to kilometers

    const coordinates = line.getCoordinates();
    if (coordinates.length < 2) return;

    const start = transform(coordinates[0], 'EPSG:3857', 'EPSG:4326');
    const end = transform(coordinates[coordinates.length - 1], 'EPSG:3857', 'EPSG:4326');
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) {
      angle += 360;
    }
    setAzimuth(angle);

    // Update input fields
    setStartLon(start[0].toFixed(6));
    setStartLat(start[1].toFixed(6));
    setEndLon(end[0].toFixed(6));
    setEndLat(end[1].toFixed(6));
  };
  

  const startMeasurement = () => {
    if (!map || !vectorLayerRef.current) return;

    setMeasuring(true);
    setDistance(null);
    setAzimuth(null);
    setShowInput(true);

    const source = vectorLayerRef.current.getSource()!;
    source.clear();

    const draw = new Draw({
      source: source,
      type: 'LineString',
      maxPoints: 2,
    });

    draw.on('drawend', (event: DrawEvent) => {
      const feature = event.feature as Feature<LineString>;
      updateMeasurement(feature);
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
    setShowInput(false);
    setStartLon('');
    setStartLat('');
    setEndLon('');
    setEndLat('');
  };

  const handleInputMeasurement = () => {
    if (!map || !vectorLayerRef.current) return;

    const start = [parseFloat(startLon), parseFloat(startLat)];
    const end = [parseFloat(endLon), parseFloat(endLat)];

    if (start.some(isNaN) || end.some(isNaN)) {
    alert('Prosím zadejte platné souřadnice.');
    return;
  }

    const source = vectorLayerRef.current.getSource()!;
    if (!source) return;

    source.clear();

    const startPoint = transform(start, 'EPSG:4326', 'EPSG:3857');
    const endPoint = transform(end, 'EPSG:4326', 'EPSG:3857');

    const lineFeature = new Feature(new LineString([startPoint, endPoint]));
    const startFeature = new Feature(new Point(startPoint));
    const endFeature = new Feature(new Point(endPoint));

    source.addFeatures([lineFeature, startFeature, endFeature]);
    updateMeasurement(lineFeature);
  };

  useEffect(() => {
  const handleError = () => {
    if (map) {
      // Vyčistit mapu
      map.getInteractions().clear();
      map.getOverlays().clear();
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current);
      }

      // Znovu inicializovat potřebné interakce a overlays
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
          updateMeasurement(features[0] as Feature<LineString>);
        }
      });

      // Znovu vytvořit overlay pro souřadnice
      const coordinateOverlay = new Overlay({
        element: document.createElement('div'),
        positioning: 'bottom-center',
        stopEvent: false,
      });
      coordinateOverlayRef.current = coordinateOverlay;
      map.addOverlay(coordinateOverlay);

      // Resetovat stav
      setMeasuring(false);
      setDistance(null);
      setAzimuth(null);
      setShowInput(false);
      setStartLon('');
      setStartLat('');
      setEndLon('');
      setEndLat('');

      // Informovat uživatele
      alert('Aplikace byla obnovena kvůli neočekávané chybě. Můžete pokračovat v práci.');
    }
  };

  window.addEventListener('error', handleError);

  return () => {
    window.removeEventListener('error', handleError);
  };
}, [map]);

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
      <FormControlLabel
        control={
          <Switch
            checked={showCoordinates}
            onChange={(e) => setShowCoordinates(e.target.checked)}
            name="showCoordinates"
          />
        }
        label="Zobrazit souřadnice"
      />
      {distance !== null && (
        <Typography variant="body1" sx={{ mt: 1 }}>
          Vzdálenost: {distance.toFixed(1)} km
        </Typography>
      )}
      {azimuth !== null && (
        <Typography variant="body1">
          Azimut: {azimuth.toFixed(2)}°
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
}

export default DistanceMeasurement;