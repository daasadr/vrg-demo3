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
    azimuth,
    startNewMeasurement 
  } = useDistanceMeasurement(map, isActive);

  return (
    <Box>
      <Button onClick={startNewMeasurement} variant="contained" color="primary">
        Nové měření
      </Button>
      
      <DistanceNumericalInput 
        points={points}
        updatePoint={updatePoint}
        unit={unit}
        setUnit={setUnit}
      />
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <strong>Vzdálenost:</strong> {distance} {unit}
        </Box>
        <Box>
          <strong>Azimut:</strong> {azimuth}°
        </Box>
      </Box>
    </Box>
  );
};

export default DistanceMeasurement;