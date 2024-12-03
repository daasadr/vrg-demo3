import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Grid, Typography } from '@mui/material';
import { NumericInput } from '../../shared/components/NumericInput';
import { DistanceUnit, MeasurementPoint } from '../../shared/types/measurement.types';

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
}) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Počáteční bod
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <NumericInput
                label="Zeměpisná délka"
                value={points[0]?.coordinates.longitude ?? ''}
                onChange={(value) => onCoordinateChange(0, 'longitude', value.toString())}
                min={-180}
                max={180}
                step={0.01}
                precision={5}
                size="small"
                sx={{ width: '180px' }}
              />
              <NumericInput
                label="Zeměpisná šířka"
                value={points[0]?.coordinates.latitude ?? ''}
                onChange={(value) => onCoordinateChange(0, 'latitude', value.toString())}
                min={-90}
                max={90}
                step={0.01}
                precision={5}
                size="small"
                sx={{ width: '180px' }}
              />
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              Koncový bod
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <NumericInput
                label="Zeměpisná délka"
                value={points[1]?.coordinates.longitude ?? ''}
                onChange={(value) => onCoordinateChange(1, 'longitude', value.toString())}
                min={-180}
                max={180}
                step={0.01}
                precision={5}
                size="small"
                sx={{ width: '180px' }}
              />
              <NumericInput
                label="Zeměpisná šířka"
                value={points[1]?.coordinates.latitude ?? ''}
                onChange={(value) => onCoordinateChange(1, 'latitude', value.toString())}
                min={-90}
                max={90}
                step={0.01}
                precision={5}
                size="small"
                sx={{ width: '180px' }}
              />
            </Box>
          </Box>
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
};

export default DistanceNumericalInput;