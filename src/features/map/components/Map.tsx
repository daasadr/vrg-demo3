import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { MeasurementProvider, useMeasurement } from '../../measurements/shared/contexts/MeasurementContext';
import MeasurementContainer from '../../measurements/shared/components/MeasurementContainer';
import CursorCoordinates from './CursorCoordinates';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { setMap } = useMeasurement();
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    console.log('Initializing map');
    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([14.4378, 50.0755]),
        zoom: 7,
      }),
    });
    
    setMap(initialMap);
    console.log('Map initialized');
    
    return () => {
      console.log('Cleaning up map');
      initialMap.setTarget(undefined);
      setMap(null);
    };
  }, [setMap]);
  
  return (
    <div className="map-wrapper" style={{ 
      minHeight: '100vh',
      paddingBottom: '8rem' 
    }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '500px', 
          position: 'relative', 
          overflow: 'hidden' 
        }} 
      />
      <div style={{ 
        marginBottom: '180px',
        position: 'relative', 
        zIndex: 1 
      }}>
        <CursorCoordinates />
        <MeasurementContainer />
      </div>
    </div>
  );
}

const MapWithProvider: React.FC = () => (
  <MeasurementProvider>
    <MapComponent />
  </MeasurementProvider>
);

export default MapWithProvider;