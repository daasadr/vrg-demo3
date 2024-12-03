import { Feature } from 'ol';
import { Point, LineString, Geometry } from 'ol/geom';
import { Style } from 'ol/style';

export type DistanceUnit = 'km' | 'mi';

export interface DistancePoint {
  longitude: number;
  latitude: number;
}

export interface DistanceMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

export interface DistanceNumericalInputProps {
  startPoint: DistancePoint;
  endPoint: DistancePoint;
  onStartPointChange: (point: DistancePoint) => void;
  onEndPointChange: (point: DistancePoint) => void;
  unit: DistanceUnit;
  onUnitChange: (unit: DistanceUnit) => void;
  distance: number;
}

export interface MeasurementFeatures {
  line?: Feature<LineString>;
  startPoint?: Feature<Geometry>;
  endPoint?: Feature<Geometry>;
}

export interface StyleOptions {
  isSelected?: boolean;
  isHovered?: boolean;
}

export type StyleFunction = (options: StyleOptions) => Style;