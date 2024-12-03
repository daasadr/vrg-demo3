export type CoordinatePoint = {
  longitude: number;
  latitude: number;
};

export type MeasurementPoint = {
  coordinates: CoordinatePoint;
  id: string;
};

export type MeasurementType = 'distance' | 'angle' | 'polyline' | null;
export type DistanceUnit = 'km' | 'mi';
export type AngleUnit = 'degrees' | 'radians';