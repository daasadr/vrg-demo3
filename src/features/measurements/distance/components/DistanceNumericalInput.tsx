import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Grid, Typography } from '@mui/material';
import { NumericInput } from '../../shared/components/NumericInput';
import { 
  DistanceUnit,
  CoordinateInputProps,
  DistanceNumericalInputProps 
} from '../types/distance.types';

const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label,
  point,
  index,
  onCoordinateChange
}) => (
  <Box>
    <Typography variant="subtitle2">{label}</Typography>
    <Grid container spacing={2}>
      <Grid item>
        <NumericInput
          label="Délka"
          value={point.coordinates.longitude}
          onChange={(value) => 
            onCoordinateChange(index, 'longitude', value.toString())
          }
          min={-180}
          max={180}
          step={0.01}
          precision={5}
          size="small"
          sx={{ width: '180px' }}
        />
      </Grid>
      <Grid item>
        <NumericInput
          label="Šířka"
          value={point.coordinates.latitude}
          onChange={(value) => 
            onCoordinateChange(index, 'latitude', value.toString())
          }
          min={-90}
          max={90}
          step={0.01}
          precision={5}
          size="small"
          sx={{ width: '180px' }}
        />
      </Grid>
    </Grid>
  </Box>
);

const DistanceNumericalInput: React.FC<DistanceNumericalInputProps> = ({
  points,
  updatePoint,
  unit,
  setUnit
}) => {
  return (
    <Box>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <CoordinateInput
            label="Počáteční bod"
            point={points[0]}
            index={0}
            onCoordinateChange={updatePoint}
          />
        </Grid>
        
        <Grid item>
          <CoordinateInput
            label="Koncový bod"
            point={points[1]}
            index={1}
            onCoordinateChange={updatePoint}
          />
        </Grid>

        <Grid item>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Jednotky</InputLabel>
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value as DistanceUnit)}
              label="Jednotky"
              size="small"
            >
              <MenuItem value="km">Kilometry</MenuItem>
              <MenuItem value="mi">Míle</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DistanceNumericalInput;