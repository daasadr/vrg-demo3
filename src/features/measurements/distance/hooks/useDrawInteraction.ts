import { useCallback, useRef } from 'react';
import { Draw, Modify } from 'ol/interaction';
import { Feature } from 'ol';
import { LineString } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import Map from 'ol/Map';
import { DrawInteractionResult } from '../types/distance.types';

export const useDrawInteraction = (
  map: Map | null,
  source: VectorSource | null,
  onChange: (feature: Feature<LineString>) => void
): DrawInteractionResult => {
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);

  const clearInteractions = useCallback(() => {
    if (map) {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      if (modifyInteractionRef.current) {
        map.removeInteraction(modifyInteractionRef.current);
        modifyInteractionRef.current = null;
      }
    }
  }, [map]);

  const startDrawing = useCallback(() => {
    if (!map || !source) return;

    clearInteractions();

    // Vytvoření Draw interakce
    const drawInteraction = new Draw({
      source: source,
      type: 'LineString',
      maxPoints: 2,
      stopClick: true,
    });

    // Vytvoření Modify interakce
    const modify = new Modify({
      source: source,
      deleteCondition: () => false
    });

    // Naslouchání na události
    drawInteraction.on('drawend', (event) => {
      const feature = event.feature as Feature<LineString>;
      onChange(feature);
      map.removeInteraction(drawInteraction);
      drawInteractionRef.current = null;
      
      // Přidáme modify interakci po dokončení kreslení
      map.addInteraction(modify);
      modifyInteractionRef.current = modify;
    });

    modify.on('modifyend', (event) => {
      const features = event.features.getArray();
      if (features.length > 0) {
        onChange(features[0] as Feature<LineString>);
      }
    });

    map.addInteraction(drawInteraction);
    drawInteractionRef.current = drawInteraction;
  }, [map, source, onChange, clearInteractions]);

  const stopDrawing = useCallback(() => {
    clearInteractions();
  }, [clearInteractions]);

  return {
    startDrawing,
    stopDrawing,
    drawInteractionRef,
    modifyInteraction: modifyInteractionRef.current
  };
};