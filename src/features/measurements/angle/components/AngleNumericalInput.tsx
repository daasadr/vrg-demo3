import React from 'react';
import { Box, Typography } from '@mui/material';
import { NumericInput } from '../../shared/components/NumericInput';
import { AngleNumericalInputProps } from '../types/angle.types';

export const AngleNumericalInput: React.FC<AngleNumericalInputProps> = ({ 
  coordinates, 
  onCoordinateChange 
}) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mb: 2 }}>
      Souřadnice bodů (WGS84):
    </Typography>
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[0, 1, 2].map((index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <NumericInput
            label={`Bod ${index + 1} - Zeměpisná délka`}
            value={coordinates[index][0]}
            onChange={(value) => onCoordinateChange(index, 'lon', value.toString())}
            min={-180}
            max={180}
            precision={5}
            size="small"
            sx={{ width: '180px' }}
          />
          <NumericInput
            label={`Bod ${index + 1} - Zeměpisná šířka`}
            value={coordinates[index][1]}
            onChange={(value) => onCoordinateChange(index, 'lat', value.toString())}
            min={-90}
            max={90}
            precision={5}
            size="small"
            sx={{ width: '180px' }}
          />
        </Box>
      ))}
    </Box>
  </Box>
);