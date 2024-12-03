import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Button, Typography } from '@mui/material';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';
import { useAngleMeasurement } from '../hooks/useAngleMeasurement';
import { AngleMeasurementProps } from '../types/angle.types';
import { AngleNumericalInput } from './AngleNumericalInput';

const AngleMeasurement: React.FC<AngleMeasurementProps> = ({ isActive }) => {
  const { map } = useMeasurement();
  const {
    angle,
    unit,
    setUnit,
    coordinates,
    handleCoordinateChange,
    startNewMeasurement,
    formatAngle
  } = useAngleMeasurement(map, isActive);
  
  const handleUnitChange = (event: SelectChangeEvent<string>) => {
    setUnit(event.target.value as 'degrees' | 'radians');
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="unit-select-label">Jednotky</InputLabel>
          <Select
            labelId="unit-select-label"
            id="unit-select"
            value={unit}
            label="Jednotky"
            onChange={handleUnitChange}
            size="small"
          >
            <MenuItem value="degrees">Stupně</MenuItem>
            <MenuItem value="radians">Radiány</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {angle !== 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            Změřený úhel: {formatAngle()}
          </Typography>
        </Box>
      )}
      
      <AngleNumericalInput 
        coordinates={coordinates}
        onCoordinateChange={handleCoordinateChange}
      />
      
      <Button
        variant="contained"
        onClick={startNewMeasurement}
        sx={{ mt: 3 }}
      >
        Nové měření
      </Button>
    </Box>
  );
};

export default AngleMeasurement;