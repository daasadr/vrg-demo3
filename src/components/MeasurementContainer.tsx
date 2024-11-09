import React from 'react';
import { useMeasurement } from './MeasurementContext';
import DistanceMeasurement from '../DistanceMeasurement/DistanceMeasurement';
import AngleMeasurement from '../AngleMeasurement/AngleMeasurement';
import PolylineMeasurement from '../PolylineMeasurement/PolylineMeasurement';

const MeasurementContainer: React.FC = () => {
  const { 
    activeMeasurement, 
    toggleMeasurement,
    clearAllMeasurements 
  } = useMeasurement();

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex gap-2">
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
      <button
        onClick={clearAllMeasurements}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Vymazat všechna měření
      </button>
    </div>
  );
};

export default MeasurementContainer;