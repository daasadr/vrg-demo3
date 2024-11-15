import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { transform } from 'ol/proj';
import { NumericalInputProps } from '../types/distance.types';
import { NumericInput } from '../../shared/components/NumericInput';

const DistanceNumericalInput: React.FC<NumericalInputProps> = ({
  onCoordinatesChange,
  initialStart,
  initialEnd,
  mapPoints,
}) => {
   const [start, setStart] = useState<[number, number]>(
    initialStart ? [initialStart[0], initialStart[1]] : [0, 0]
  );
  const [end, setEnd] = useState<[number, number]>(
    initialEnd ? [initialEnd[0], initialEnd[1]] : [0, 0]
  );
  const isInternalUpdate = useRef(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

const updateCoordinates = useCallback((newStart: [number, number], newEnd: [number, number]) => {
  if (isEditing) return;

  const transformedStart = transform(newStart, 'EPSG:4326', 'EPSG:3857') as [number, number];
  const transformedEnd = transform(newEnd, 'EPSG:4326', 'EPSG:3857') as [number, number];

  if (!isInternalUpdate.current) {
    onCoordinatesChange(transformedStart, transformedEnd);
  }
}, [onCoordinatesChange, isEditing]);

useEffect(() => {
  if (!isEditing && mapPoints?.start && mapPoints?.end) {
    isInternalUpdate.current = true;

    const transformedStart = transform(mapPoints.start, 'EPSG:3857', 'EPSG:4326');
    const transformedEnd = transform(mapPoints.end, 'EPSG:3857', 'EPSG:4326');

    setStart([
      parseFloat(transformedStart[0].toFixed(5)),
      parseFloat(transformedStart[1].toFixed(5))
    ]);
    setEnd([
      parseFloat(transformedEnd[0].toFixed(5)),
      parseFloat(transformedEnd[1].toFixed(5))
    ]);

    isInternalUpdate.current = false;
  }
}, [mapPoints, isEditing]);

 const handleCoordinateChange = (
  point: 'start' | 'end',
  coord: 'x' | 'y',
  value: number
) => {
  setIsEditing(true);
  if (point === 'start') {
    setStart((prev) => [
      coord === 'x' ? value : prev[0],
      coord === 'y' ? value : prev[1],
    ]);
    onCoordinatesChange([value, start[1]], end);
  } else {
    setEnd((prev) => [
      coord === 'x' ? value : prev[0],
      coord === 'y' ? value : prev[1],
    ]);
    onCoordinatesChange(start, [value, end[1]]);
  }
};

  const handleInputBlur = () => {
  setIsEditing(false);
};

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Zadejte souřadnice bodů:
      </Typography>
      
      <Box display="flex" gap={2} mb={2}>
        <NumericInput
  label="Start X"
  value={start[0]}
  onChange={(value) => handleCoordinateChange('start', 'x', Number(value))}
  onBlur={handleInputBlur}
  precision={5}
  size="small"
  sx={{ width: '180px' }}

        />
        <NumericInput
  label="End X"
  value={end[0]}
  onChange={(value) => handleCoordinateChange('end', 'x', Number(value))}
  onBlur={handleInputBlur}
  precision={5}
  size="small"
  sx={{ width: '180px' }}
/>
      </Box>
      
      <Box display="flex" gap={2}>
        <NumericInput
  label="End Y"
  value={end[1]}
  onChange={(value) => handleCoordinateChange('end', 'y', Number(value))}
  onBlur={handleInputBlur}
  precision={5}
  size="small"
  sx={{ width: '180px' }}
/>
        <NumericInput
          label="End Y"
          value={end[1]}
          onChange={(value) => handleCoordinateChange('end', 'y', Number(value))}
          onBlur={handleInputBlur}
          precision={5}
          size="small"
          sx={{ width: '180px' }}
        />
      </Box>
    </Box>
  );
};

export default DistanceNumericalInput;