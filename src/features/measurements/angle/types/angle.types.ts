import { Coordinate } from 'ol/coordinate';

export type AngleUnit = 'degrees' | 'radians';

export interface AngleMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

export interface AngleDisplayProps {
  angle: number;
  unit: AngleUnit;
}

export interface AngleCoordinates {
  coordinates: Array<[string, string]>;
  onCoordinateChange: (index: number, type: 'lon' | 'lat', value: string) => void;
  onMeasure: () => void;
}

export interface AngleNumericalInputProps {
  onPointsChange: (points: Coordinate[]) => void;
  initialPoints?: Coordinate[];
}

export type CoordinateSystem = 'EPSG:4326' | 'EPSG:3857';