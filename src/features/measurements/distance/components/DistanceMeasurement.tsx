import React from 'react';
import { Box, Button } from '@mui/material';
import { useDistanceMeasurement } from '../hooks/useDistanceMeasurement';
import DistanceNumericalInput from './DistanceNumericalInput';
import { useMeasurement } from '../../shared/contexts/MeasurementContext';

const DistanceMeasurement: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { map } = useMeasurement();
  const {
    points,
    updatePoint,
    unit,
    setUnit,
    distance,
    startNewMeasurement
  } = useDistanceMeasurement(map, isActive);

  return (
    <Box sx={{ p: 2 }}>
      <DistanceNumericalInput
        points={points}
        onCoordinateChange={updatePoint}
        unit={unit}
        onUnitChange={setUnit}
        distance={distance}
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

export default DistanceMeasurement;