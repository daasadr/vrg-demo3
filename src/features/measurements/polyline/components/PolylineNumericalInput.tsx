import React from 'react';
import { Box, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PointCoordinate } from '../types/polyline.types';
import { NumericInput } from '../../shared/components/NumericInput';

interface PolylineNumericalInputProps {
  points: PointCoordinate[];
  onCoordinateChange: (index: number, field: 'lon' | 'lat', value: string) => void;
  onRemovePoint: (index: number) => void;
  onAddPoint: () => void;
}

export const PolylineNumericalInput: React.FC<PolylineNumericalInputProps> = ({
  points,
  onCoordinateChange,
  onRemovePoint,
  onAddPoint
}) => {
  const handleValueChange = (index: number, field: 'lon' | 'lat', value: number | string) => {
    onCoordinateChange(index, field, value.toString());
  };

  return (
    <Box>
      {points.map((point, index) => (
        <Box key={index} sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <NumericInput
            label={`Bod ${index + 1} - Zeměpisná délka`}
            value={point.lon}
            onChange={(value) => handleValueChange(index, 'lon', value)}
            min={-180}
            max={180}
            step={0.01}
            precision={5}
            size="small"
            sx={{ width: '180px', mr: 1 }}
          />
          <NumericInput
            label={`Bod ${index + 1} - Zeměpisná šířka`}
            value={point.lat}
            onChange={(value) => handleValueChange(index, 'lat', value)}
            min={-90}
            max={90}
            step={0.01}
            precision={5}
            size="small"
            sx={{ width: '180px', mr: 1 }}
          />
          <IconButton
            onClick={() => onRemovePoint(index)}
            size="small"
            sx={{ ml: 1 }}
            aria-label={`Odstranit bod ${index + 1}`}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      ))}
      
      <Button
        variant="outlined"
        onClick={onAddPoint}
        sx={{ mt: 2 }}
      >
        Přidat bod
      </Button>
    </Box>
  );
};