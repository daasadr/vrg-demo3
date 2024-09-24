import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { transform } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';

interface AngleNumericalInputProps {
  onPointsChange: (points: Coordinate[]) => void;
  initialPoints?: Coordinate[];
}

type CoordinateSystem = 'EPSG:4326' | 'EPSG:3857';

const AngleNumericalInput: React.FC<AngleNumericalInputProps> = ({
  onPointsChange,
  initialPoints,
}) => {
  const [points, setPoints] = useState<Coordinate[]>(initialPoints || []);
  const [coordinateSystem, setCoordinateSystem] = useState<CoordinateSystem>('EPSG:4326');

  useEffect(() => {
    const transformedPoints = points.map(point => 
      transform(point, coordinateSystem, 'EPSG:3857') as Coordinate
    );
    onPointsChange(transformedPoints);
  }, [points, coordinateSystem, onPointsChange]);

  const handleInputChange = (
    index: number,
    coord: 'x' | 'y',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newPoints = [...points];
      if (!newPoints[index]) {
        newPoints[index] = [0, 0];
      }
      newPoints[index] = [...newPoints[index]];
      newPoints[index][coord === 'x' ? 0 : 1] = numValue;
      setPoints(newPoints);
    }
  };

  const handleCoordinateSystemChange = (event: SelectChangeEvent<CoordinateSystem>) => {
    const newSystem = event.target.value as CoordinateSystem;
    setCoordinateSystem(newSystem);

    const newPoints = points.map(point => 
      transform(point, coordinateSystem, newSystem) as Coordinate
    );
    setPoints(newPoints);
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
      {[0, 1, 2].map((index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <TextField
            label={`Bod ${index + 1} ${coordinateSystem === 'EPSG:4326' ? "Lon" : "X"}`}
            type="number"
            value={points[index]?.[0] || ''}
            onChange={(e) => handleInputChange(index, 'x', e.target.value)}
            size="small"
          />
          <TextField
            label={`Bod ${index + 1} ${coordinateSystem === 'EPSG:4326' ? "Lat" : "Y"}`}
            type="number"
            value={points[index]?.[1] || ''}
            onChange={(e) => handleInputChange(index, 'y', e.target.value)}
            size="small"
          />
        </Box>
      ))}
    </Box>
  );
};

export default AngleNumericalInput;