import { Map } from 'ol';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

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

export interface MeasurementLayers {
  distance: VectorLayer<VectorSource>;
  angle: VectorLayer<VectorSource>;
  polyline: VectorLayer<VectorSource>;
}

export interface MeasurementContextType {
  activeMeasurement: MeasurementType;
  map: Map | null;
  measurementLayers: MeasurementLayers;
  setMap: (map: Map | null) => void;
  toggleMeasurement: (type: MeasurementType) => void;
  clearMeasurement: (type: Exclude<MeasurementType, null>) => void;
  clearAllMeasurements: () => void;
}