import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import { usePolylineMeasurement } from '../hooks/usePolylineMeasurement';
import { PolylineNumericalInput } from './PolylineNumericalInput';
import { PolylineMeasurementProps } from '../types/polyline.types';

const PolylineMeasurement: React.FC<PolylineMeasurementProps> = ({ isActive }) => {
  const {
    totalDistance,
    points,
    unit,
    handleUnitChange,
    handleCoordinateChange,
    addNewPoint,
    removePoint,
    startNewMeasurement
  } = usePolylineMeasurement();

  return (
    <Box sx={{ mt: 2 }}>
      {totalDistance !== null && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Celková vzdálenost: {totalDistance.toFixed(2)} {unit === 'kilometers' ? 'km' : 'mi'}
        </Typography>
      )}
      
      <ToggleButtonGroup
        value={unit}
        exclusive
        onChange={handleUnitChange}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="kilometers">km</ToggleButton>
        <ToggleButton value="miles">mi</ToggleButton>
      </ToggleButtonGroup>

      <PolylineNumericalInput
        points={points}
        onCoordinateChange={handleCoordinateChange}
        onRemovePoint={removePoint}
        onAddPoint={addNewPoint}
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

export default PolylineMeasurement;