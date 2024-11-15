import React from 'react';
import { Box, Typography, Select, MenuItem } from '@mui/material';
import { DistanceUnit } from '../types/distance.types';

interface DistanceDisplayProps {
  distance: number | null;
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({ 
  distance, 
  unit, 
  onUnitChange 
}) => {
  const convertDistance = (distanceInKm: number, targetUnit: DistanceUnit): number => {
    return targetUnit === 'km' ? distanceInKm : distanceInKm * 0.621371;
  };

  if (distance === null) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
      <Typography variant="body1">
        Vzdálenost: {convertDistance(distance, unit).toFixed(3)} {unit === 'km' ? 'km' : 'mi'}
      </Typography>
      <Select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as DistanceUnit)}
        size="small"
        sx={{ ml: 2, minWidth: 100 }}
      >
        <MenuItem value="km">Kilometry</MenuItem>
        <MenuItem value="mi">Míle</MenuItem>
      </Select>
    </Box>
  );
};