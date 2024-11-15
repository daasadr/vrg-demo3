import { Map } from 'ol';
import { Draw, Modify } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { LineString, Point } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';
import Feature, { FeatureLike } from 'ol/Feature';
import { Style, Stroke, Circle, Fill } from 'ol/style';

export const createStyle = () => {
  return function(feature: FeatureLike) {
    const geometry = feature.getGeometry();
    if (geometry instanceof LineString) {
      return new Style({
        stroke: new Stroke({
          color: 'red',
          width: 2,
        }),
      });
    } else if (geometry instanceof Point) {
      return new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: 'blue',
          }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      });
    }
    return new Style({});
  };
};

export const setupMapInteractions = (
  map: Map,
  source: VectorSource,
  updateFeatures: (coords: Coordinate[]) => void,
  calculateAngle: (coords: Coordinate[]) => void,
  setCoordinates: (coords: Array<[string, string]>) => void
) => {
  let points: Coordinate[] = [];
  let tempLineFeature: Feature | null = null;
  
  const draw = new Draw({
    source: source,
    type: 'Point',
    stopClick: true,
  });

  // Definujeme funkci pro handling pohybu myši
  const handlePointerMove = (event: any) => {
    if (points.length > 0 && points.length < 3) {
      const mouseCoord = event.coordinate;
      
      // Odstraníme předchozí dočasnou čáru
      if (tempLineFeature) {
        source.removeFeature(tempLineFeature);
      }
      
      // Vytvoříme novou dočasnou čáru od posledního bodu k pozici myši
      const lineCoords = [...points, mouseCoord];
      tempLineFeature = new Feature(new LineString(lineCoords));
      source.addFeature(tempLineFeature);
    }
  };

  map.on('pointermove', handlePointerMove);

  draw.on('drawend', (event) => {
    const feature = event.feature;
    const geometry = feature.getGeometry();
    
    if (geometry instanceof Point) {
      const coord = geometry.getCoordinates();
      
      if (points.length < 3) {
        points.push(coord);
        feature.set('pointIndex', points.length - 1);
        
        // Odstraním dočasnou čáru po přidání bodu
        if (tempLineFeature) {
          source.removeFeature(tempLineFeature);
          tempLineFeature = null;
        }
        
        const lonLat = toLonLat(coord);
        const newCoordinates: Array<[string, string]> = points.map(point => {
          const lonLatPoint = toLonLat(point);
          return [lonLatPoint[0].toFixed(6), lonLatPoint[1].toFixed(6)];
        });
        
        while (newCoordinates.length < 3) {
          newCoordinates.push(['', '']);
        }
        
        setCoordinates(newCoordinates);

        // Vytvořím permanentní čáru mezi body
        if (points.length >= 2) {
          source.getFeatures()
            .filter(f => f.getGeometry() instanceof LineString && f !== tempLineFeature)
            .forEach(f => source.removeFeature(f));
            
          const lineString = new Feature(new LineString(points));
          source.addFeature(lineString);
        }

        if (points.length === 3) {
          updateFeatures(points);
          calculateAngle(points);
          map.removeInteraction(draw);
          // Odstraním move listener po dokončení měření
          map.un('pointermove', handlePointerMove);
        }
      }
    }
  });

  const modify = new Modify({
    source: source
  });

  modify.on('modifyend', () => {
    const features = source.getFeatures();
    const pointFeatures = features
      .filter(f => f.getGeometry() instanceof Point)
      .sort((a, b) => (a.get('pointIndex') || 0) - (b.get('pointIndex') || 0));

    points = pointFeatures
      .map(f => f.getGeometry())
      .filter((g): g is Point => g instanceof Point)
      .map(g => g.getCoordinates());

    if (points.length === 3) {
      const lineFeatures = features.filter(f => f.getGeometry() instanceof LineString);
      lineFeatures.forEach(f => source.removeFeature(f));
      
      const lineString = new Feature(new LineString(points));
      source.addFeature(lineString);

      const newCoordinates: Array<[string, string]> = points.map(point => {
        const lonLatPoint = toLonLat(point);
        return [lonLatPoint[0].toFixed(6), lonLatPoint[1].toFixed(6)];
      });
      
      setCoordinates(newCoordinates);
      calculateAngle(points);
    }
  });

  map.addInteraction(modify);
  map.addInteraction(draw);

  return () => {
    points = [];
    if (tempLineFeature) {
      source.removeFeature(tempLineFeature);
    }
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    map.un('pointermove', handlePointerMove);
    source.clear();
  };
};