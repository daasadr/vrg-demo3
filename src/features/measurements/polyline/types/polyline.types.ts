import { Map } from 'ol';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';

export type MeasurementUnit = 'kilometers' | 'miles';

export interface PointCoordinate {
  lon: string;
  lat: string;
}

export interface PolylineMeasurementProps {
  isActive: boolean;
  onActivate: () => void;
}

export interface UsePolylineMeasurementReturn {
  source: VectorSource;
  totalDistance: number | null;
  points: PointCoordinate[];
  unit: MeasurementUnit;
  vectorLayerRef: React.MutableRefObject<VectorLayer<VectorSource> | null>;
  drawInteractionRef: React.MutableRefObject<Draw | null>;
  modifyInteractionRef: React.MutableRefObject<Modify | null>;
  handleUnitChange: (event: React.MouseEvent<HTMLElement>, newUnit: MeasurementUnit) => void;
  handleCoordinateChange: (index: number, field: 'lon' | 'lat', value: string) => void;
  addNewPoint: () => void;
  removePoint: (index: number) => void;
  startNewMeasurement: () => void;
}