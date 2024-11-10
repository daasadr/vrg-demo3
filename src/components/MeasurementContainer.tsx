import React, { useState } from 'react';
import { useMeasurement } from './MeasurementContext';
import DistanceMeasurement from '../DistanceMeasurement/DistanceMeasurement';
import AngleMeasurement from '../AngleMeasurement/AngleMeasurement';
import PolylineMeasurement from '../PolylineMeasurement/PolylineMeasurement';
import './MeasurementContainer.css';

const HELP_TEXTS = {
  distance: [
    'Vyznačte dva body v mapě, nebo vložte do souřadnice do políček.',
    'Polohu bodů můžete dále upravovat přetažením v mapě nebo úpravou číselných hodnot souřadnic.',
    'Tlačítko "Ukončit měření" Vás vrátí do výběru měření.'
  ],
  angle: [
    'Vyznačte úhel na mapě pomocí tří bodů, nebo zapište číselné souřadnice bodů do polí.',
    'Polohu bodů můžete dále upravovat přetažením nebo úpravou číselných hodnot.',
    'Tlačítkem "Ukončit měření" se vrátíte do výběru měření.'
  ],
  polyline: [
    'Vyznačte v mapě body polyčáry nebo zapište čístelné souřadnice do polí.',
    'Když jste označili poslední bod polyčáry, ukončete kreslení opakovaným kliknutím v tomto bodě.',
    'Polohu bodů můžete upravovat přetažením na mapě nebo změnou číselných souřadnic.',
    'Zpět do výběru měření se vrátíte tlačítkem "Ukončit měření".'
  ]
};

const MeasurementContainer = () => {
  const {
    activeMeasurement,
    toggleMeasurement,
    clearAllMeasurements
  } = useMeasurement();

  const [isSelectionVisible, setIsSelectionVisible] = useState(true);

  const handleMeasurementSelect = (type: 'distance' | 'angle' | 'polyline') => {
    toggleMeasurement(type);
    setIsSelectionVisible(false);
  };

  const handleEndMeasurement = () => {
    toggleMeasurement(null);
    clearAllMeasurements();
    setIsSelectionVisible(true);
  };

  const HelpTooltip = ({ type }: { type: 'distance' | 'angle' | 'polyline' }) => (
    <>
      <div className="help-icon">?</div>
      <div className="help-tooltip">
        <ul>
          {HELP_TEXTS[type].map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      </div>
    </>
  );

  const ActiveMeasurement = () => {
    switch (activeMeasurement) {
      case 'distance':
        return (
          <>
            <HelpTooltip type="distance" />
            <DistanceMeasurement isActive={true} onActivate={() => {}} />
          </>
        );
      case 'angle':
        return (
          <>
            <HelpTooltip type="angle" />
            <AngleMeasurement isActive={true} onActivate={() => {}} />
          </>
        );
      case 'polyline':
        return (
          <>
            <HelpTooltip type="polyline" />
            <PolylineMeasurement isActive={true} onActivate={() => {}} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="measurement-container">
      <div className="measurement-box">
        {isSelectionVisible ? (
          <div className="selection-content">
            <h2>Co si přejete měřit?</h2>
            <div className="button-group">
              <button onClick={() => handleMeasurementSelect('distance')}>
                Měření přímé vzdálenosti
              </button>
              <button onClick={() => handleMeasurementSelect('angle')}>
                Měření úhlu
              </button>
              <button onClick={() => handleMeasurementSelect('polyline')}>
                Měření polyčárou
              </button>
            </div>
          </div>
        ) : (
          <div className="active-measurement">
            <ActiveMeasurement />
            <button className="end-button" onClick={handleEndMeasurement}>
              Ukončit měření
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementContainer;