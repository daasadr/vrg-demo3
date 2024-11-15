import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { LineString, Point } from 'ol/geom';
import Map from 'ol/Map';

export const useMeasurementLayer = (map: Map | null) => {
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createStyleFunction(),
    });

    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    return () => {
      if (map) {
        map.removeLayer(vectorLayer);
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

  return vectorLayerRef;
};