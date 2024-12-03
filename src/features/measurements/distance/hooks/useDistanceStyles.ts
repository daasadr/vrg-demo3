import { Style, Circle, Stroke, Fill } from 'ol/style';
import { StyleFunction } from '../types/distance.types';

const useDistanceStyles = () => {
  const pointStyle: StyleFunction = ({ isSelected, isHovered }) => {
    return new Style({
      image: new Circle({
        radius: isSelected || isHovered ? 7 : 5,
        fill: new Fill({
          color: isSelected ? '#2196f3' : isHovered ? '#64b5f6' : '#f44336'
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2
        })
      })
    });
  };

  const lineStyle: StyleFunction = ({ isSelected, isHovered }) => {
    return new Style({
      stroke: new Stroke({
        color: isSelected ? '#2196f3' : isHovered ? '#64b5f6' : '#f44336',
        width: isSelected || isHovered ? 3 : 2,
        lineDash: isHovered ? [4] : undefined
      })
    });
  };

  return {
    pointStyle,
    lineStyle
  };
};

export default useDistanceStyles;