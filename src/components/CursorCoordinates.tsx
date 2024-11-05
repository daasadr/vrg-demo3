import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'ol';
import { transform } from 'ol/proj';
import Overlay from 'ol/Overlay';
import { Box, Switch, FormControlLabel } from '@mui/material';
import { useMeasurement } from '../components/MeasurementContext';

interface CursorCoordinatesProps {
  initialShowCoordinates?: boolean;
}

const CursorCoordinates: React.FC<CursorCoordinatesProps> = ({ 
  initialShowCoordinates = true 
}) => {
  const { map } = useMeasurement();
  const [showCoordinates, setShowCoordinates] = useState(initialShowCoordinates);
  const overlayRef = useRef<Overlay | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('CursorCoordinates mounted, map:', !!map);
    if (!map) return;

    // Vytvoření elementu pro zobrazení souřadnic
    const element = document.createElement('div');
    element.className = 'cursor-coordinates';
    element.style.cssText = `
      background-color: rgba(255, 255, 255, 0.9);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      border: 1px solid #ccc;
      position: absolute;
      z-index: 1000;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    elementRef.current = element;
    document.body.appendChild(element);

    // Vytvoření overlay
    const overlay = new Overlay({
      element: element,
      positioning: 'center-left',
      offset: [10, 0],
      stopEvent: false
    });
    overlayRef.current = overlay;
    map.addOverlay(overlay);

    // Handler pro pohyb myši
    const handleMouseMove = (evt: any) => {
      if (!showCoordinates) {
        overlay.setPosition(undefined);
        return;
      }

      // Získání pixel koordinátů z události
      const pixel = map.getEventPixel(evt.originalEvent);
      // Převod pixel koordinátů na map koordináty
      const coordinate = map.getCoordinateFromPixel(pixel);
      
      if (coordinate) {
        // Transformace z EPSG:3857 do EPSG:4326 (WGS84)
        const [lon, lat] = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
        
        if (!isNaN(lon) && !isNaN(lat)) {
          element.innerHTML = `
            Lon: ${lon.toFixed(6)}°<br>
            Lat: ${lat.toFixed(6)}°
          `;
          overlay.setPosition(coordinate);
        }
      }
    };

    // Handler pro opuštění mapy
    const handleMouseOut = () => {
      overlay.setPosition(undefined);
    };

    // Přidání event listenerů
    map.on('pointermove', handleMouseMove);
    const viewport = map.getViewport();
    viewport.addEventListener('mouseout', handleMouseOut);

    return () => {
      map.removeOverlay(overlay);
      map.un('pointermove', handleMouseMove);
      viewport.removeEventListener('mouseout', handleMouseOut);
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [map, showCoordinates]);

  return (
    <Box sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={showCoordinates}
            onChange={(e) => setShowCoordinates(e.target.checked)}
            name="showCoordinates"
          />
        }
        label="Zobrazit souřadnice kurzoru"
      />
    </Box>
  );
};

export default CursorCoordinates;