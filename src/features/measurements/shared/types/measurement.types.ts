export type CoordinatePoint = {
  longitude: number;
  latitude: number;
};

export type MeasurementPoint = {
  coordinates: CoordinatePoint;
  id: string;
};

export type DistanceUnit = 'km' | 'mi';
export type AngleUnit = 'degrees' | 'radians';