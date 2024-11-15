import { Feature } from 'ol';
import { LineString } from 'ol/geom';
import { Draw, Modify } from 'ol/interaction';
import { MutableRefObject } from 'react';

export interface DrawInteractionResult {
  startDrawing: () => void;
  stopDrawing: () => void;
  drawInteractionRef: MutableRefObject<Draw | null>;
  modifyInteraction: Modify | null;
}

export type DistanceUnit = 'km' | 'mi';

export interface MeasurementFeature extends Feature<LineString> {
  getGeometry(): LineString;
}

export interface DistanceMeasurementProps {
  isActive?: boolean;
  onActivate: () => void;
  
}
export interface NumericalInputProps {
  onCoordinatesChange: (start: [number, number], end: [number, number]) => void;
  initialStart?: [number, number];
  initialEnd?: [number, number];
  mapPoints?: {
    start?: [number, number];
    end?: [number, number];
  };
}
