import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Grid, Typography } from '@mui/material';
import { NumericInput } from '../../shared/components/NumericInput';
import { DistanceUnit, } from '../types/distance.types';
import { MeasurementPoint } from '../../shared/types/measurement.types';

interface CoordinateInputProps {
  label: string;
  point: MeasurementPoint;
  index: number;
  onCoordinateChange: (index: number, field: 'longitude' | 'latitude', value: string) => void;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label,
  point,
  index,
  onCoordinateChange
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle1">{label}</Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <NumericInput
        label="Zeměpisná délka"
        value={point?.coordinates.longitude ?? ''}
        onChange={(value) => onCoordinateChange(index, 'longitude', value.toString())}
        min={-180}
        max={180}
        step={0.01}
        precision={5}
        size="small"
        sx={{ width: '180px' }}
      />
      <NumericInput
        label="Zeměpisná šířka"
        value={point?.coordinates.latitude ?? ''}
        onChange={(value) => onCoordinateChange(index, 'latitude', value.toString())}
        min={-90}
        max={90}
        step={0.01}
        precision={5}
        size="small"
        sx={{ width: '180px' }}
      />
    </Box>
  </Box>
);

interface DistanceNumericalInputProps {
  points: MeasurementPoint[];
  onCoordinateChange: (index: number, field: 'longitude' | 'latitude', value: string) => void;
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
  distance: number;
}

const DistanceNumericalInput: React.FC<DistanceNumericalInputProps> = ({
  points,
  onCoordinateChange,
  unit,
  onUnitChange,
  distance
}) => (
  <Box sx={{ mt: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <CoordinateInput
          label="Počáteční bod"
          point={points[0]}
          index={0}
          onCoordinateChange={onCoordinateChange}
        />
      </Grid>
      <Grid item xs={12}>
        <CoordinateInput
          label="Koncový bod"
          point={points[1]}
          index={1}
          onCoordinateChange={onCoordinateChange}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl size="small">
          <InputLabel>Jednotky</InputLabel>
          <Select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as DistanceUnit)}
            label="Jednotky"
            size="small"
          >
            <MenuItem value="km">Kilometry</MenuItem>
            <MenuItem value="mi">Míle</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Vzdálenost: {distance.toFixed(3)} {unit}
        </Typography>
      </Grid>
    </Grid>
  </Box>
);

export default DistanceNumericalInput;