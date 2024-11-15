import React from 'react';
import { TextField, Box, Typography, Button } from '@mui/material';
import { AngleCoordinates } from '../types/angle.types';

export const AngleCoordinatesInput: React.FC<AngleCoordinates> = ({
  coordinates,
  onCoordinateChange,
  onMeasure
}) => {
  const inputProps = {
    step: 0.01,
    min: -180,
    max: 180,
  };

  const latitudeInputProps = {
    ...inputProps,
    min: -90,
    max: 90,
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Souřadnice bodů (WGS84):
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[0, 1, 2].map((index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label={`Bod ${index + 1} - Zeměpisná délka`}
              type="number"
              value={coordinates[index][0]}
              onChange={(e) => onCoordinateChange(index, 'lon', e.target.value)}
              inputProps={inputProps}
              variant="outlined"
              size="small"
              sx={{ width: '180px' }}
            />
            <TextField
              label={`Bod ${index + 1} - Zeměpisná šířka`}
              type="number"
              value={coordinates[index][1]}
              onChange={(e) => onCoordinateChange(index, 'lat', e.target.value)}
              inputProps={latitudeInputProps}
              variant="outlined"
              size="small"
              sx={{ width: '180px' }}
            />
          </Box>
        ))}
      </Box>

      <Button 
        variant="contained"
        onClick={onMeasure}
        sx={{ mt: 3 }}
      >
        Změřit zadané souřadnice
      </Button>
    </Box>
  );
};