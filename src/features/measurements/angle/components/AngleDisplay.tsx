import React from 'react';
import { Typography, Box } from '@mui/material';
import { AngleDisplayProps } from '../types/angle.types';

export const AngleDisplay: React.FC<AngleDisplayProps> = ({ angle, unit }) => {
  const formatAngle = (): string => {
    if (unit === 'radians') {
      return (angle * (Math.PI / 180)).toFixed(4) + ' rad';
    }
    return angle.toFixed(2) + '°';
  };

  return (
    <Box sx={{ mb: 2 }}>
      {angle !== 0 && (
        <Typography variant="body1">
          Změřený úhel: {formatAngle()}
        </Typography>
      )}
    </Box>
  );
};