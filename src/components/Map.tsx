import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import DistanceMeasurement from '../DistanceMeasurement/DistanceMeasurement';
import AngleMeasurement from '../AngleMeasuremet/AngleMeasurement';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([14.4378, 50.0755]), // Praha
        zoom: 7,
      }),
    });

    setMap(initialMap);

    return () => initialMap.setTarget(undefined);
  }, []);

    return (
    <>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      <DistanceMeasurement map={map} />
      <AngleMeasurement map={map} />
    </>
  );
}

export default MapComponent;