import { Feature } from 'ol';
import { Point, LineString, Geometry } from 'ol/geom';
import { Style } from 'ol/style';
import { MeasurementPoint } from '../../shared/types/measurement.types';

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
  points: MeasurementPoint[];
  updatePoint: (index: number, field: "longitude" | "latitude", value: string) => void;
  unit: DistanceUnit;
  setUnit: (unit: DistanceUnit) => void;
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

export interface CoordinateInputProps {
  label: string;
  point: MeasurementPoint;
  index: number;
  onCoordinateChange: (index: number, field: 'longitude' | 'latitude', value: string) => void;
}

export type StyleFunction = (options: StyleOptions) => Style;