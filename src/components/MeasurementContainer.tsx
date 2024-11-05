import React from 'react';
import { useMeasurement } from './MeasurementContext';
import DistanceMeasurement from '../DistanceMeasurement/DistanceMeasurement';
import AngleMeasurement from '../AngleMeasurement/AngleMeasurement';
import PolylineMeasurement from '../PolylineMeasurement/PolylineMeasurement';


const MeasurementContainer: React.FC = () => {
  const { activeMeasurement, toggleMeasurement } = useMeasurement();

  return (
    <div>
      <DistanceMeasurement
        isActive={activeMeasurement === 'distance'}
        onActivate={() => toggleMeasurement('distance')}
      />
      <AngleMeasurement
        isActive={activeMeasurement === 'angle'}
        onActivate={() => toggleMeasurement('angle')}
      />
      <PolylineMeasurement
        isActive={activeMeasurement === 'polyline'}
        onActivate={() => toggleMeasurement('polyline')}
      />
    </div>
  );
};

export default MeasurementContainer;