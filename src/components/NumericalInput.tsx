import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { transform,  } from 'ol/proj';

interface NumericalInputProps {
  onCoordinatesChange: (start: [number, number], end: [number, number]) => void;
  initialStart?: [number, number];
  initialEnd?: [number, number];
}

type CoordinateSystem = 'EPSG:4326' | 'EPSG:3857';

const NumericalInput: React.FC<NumericalInputProps> = ({
  onCoordinatesChange,
  initialStart,
  initialEnd,
}) => {
  const [start, setStart] = useState<[number, number]>(initialStart || [0, 0]);
  const [end, setEnd] = useState<[number, number]>(initialEnd || [0, 0]);
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>('EPSG:4326');

  useEffect(() => {
    const transformedStart = transform(start, coordinateSystem, 'EPSG:3857')as [number, number];
    const transformedEnd = transform(end, coordinateSystem, 'EPSG:3857')as [number, number];
    onCoordinatesChange(transformedStart, transformedEnd);
  }, [start, end, coordinateSystem, onCoordinatesChange]);

  const handleInputChange = (
    point: 'start' | 'end',
    coord: 'x' | 'y',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newCoords: [number, number] = point === 'start' ? [...start] : [...end];
      newCoords[coord === 'x' ? 0 : 1] = numValue;
      if (point === 'start') {
        setStart(newCoords);
      } else {
        setEnd(newCoords);
      }
    }
  };

  const handleCoordinateSystemChange = (event: SelectChangeEvent<CoordinateSystem>) => {
    const newSystem = event.target.value as CoordinateSystem;
    setCoordinateSystem(newSystem);
    
    // Transform existing coordinates to the new system
    const newStart = transform(start, coordinateSystem, newSystem)as [number, number];
    const newEnd = transform(end, coordinateSystem, newSystem)as [number, number];
    
    setStart(newStart);
    setEnd(newEnd);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1">Zadejte souřadnice bodů:</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <Select
          value={coordinateSystem}
          onChange={handleCoordinateSystemChange}
          size="small"
        >
          <MenuItem value="EPSG:4326">WGS 84 (Lat/Lon)</MenuItem>
          <MenuItem value="EPSG:3857">Web Mercator</MenuItem>
        </Select>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <TextField
          label={coordinateSystem === 'EPSG:4326' ? "Start Lon" : "Start X"}
          type="number"
          value={start[0]}
          onChange={(e) => handleInputChange('start', 'x', e.target.value)}
          size="small"
        />
        <TextField
          label={coordinateSystem === 'EPSG:4326' ? "Start Lat" : "Start Y"}
          type="number"
          value={start[1]}
          onChange={(e) => handleInputChange('start', 'y', e.target.value)}
          size="small"
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
        <TextField
          label={coordinateSystem === 'EPSG:4326' ? "Konec Lon" : "Konec X"}
          type="number"
          value={end[0]}
          onChange={(e) => handleInputChange('end', 'x', e.target.value)}
          size="small"
        />
        <TextField
          label={coordinateSystem === 'EPSG:4326' ? "Konec Lat" : "Konec Y"}
          type="number"
          value={end[1]}
          onChange={(e) => handleInputChange('end', 'y', e.target.value)}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default NumericalInput;