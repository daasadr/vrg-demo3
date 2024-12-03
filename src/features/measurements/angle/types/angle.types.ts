
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
  coordinates: Array<[number | string, number | string]>;
  onCoordinateChange: (index: number, type: 'lon' | 'lat', value: string) => void;
  onMeasure: () => void;
}

export interface AngleNumericalInputProps {
  coordinates: Array<[number | string, number | string]>;
  onCoordinateChange: (index: number, type: 'lon' | 'lat', value: string) => void;
}

export type CoordinateSystem = 'EPSG:4326' | 'EPSG:3857';