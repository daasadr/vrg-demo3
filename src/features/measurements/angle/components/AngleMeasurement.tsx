import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Button } from '@mui/material';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';
import { useAngleMeasurement } from '../hooks/useAngleMeasurement';
import { AngleDisplay } from './AngleDisplay';
import { AngleCoordinatesInput } from './AngleCoordinatesInput';
import { AngleMeasurementProps } from '../types/angle.types';

const AngleMeasurement: React.FC<AngleMeasurementProps> = ({ isActive }) => {
  const { map } = useMeasurement();
  const {
    angle,
    unit,
    setUnit,
    coordinates,
    handleCoordinateChange,
    measureFromCoordinates,
    startNewMeasurement
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

      <AngleDisplay angle={angle} unit={unit} />

      <AngleCoordinatesInput
        coordinates={coordinates}
        onCoordinateChange={handleCoordinateChange}
        onMeasure={measureFromCoordinates}
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