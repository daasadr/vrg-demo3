import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface NumericInputProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number | string) => void;
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
  allowEmptyValue?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  precision = 5,
  min,
  max,
  step = 0.01,
  allowEmptyValue = false,
  ...textFieldProps
}) => {
  // Interní stav pro neformátovanou hodnotu během editace
  const [internalValue, setInternalValue] = React.useState<string>(
    formatValue(value, precision)
  );

  // Formátování hodnoty na požadovaný počet desetinných míst
  function formatValue(val: number | string, decimals: number): string {
    if (val === '' || val === '-') return val;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return allowEmptyValue ? '' : '0';
    return num.toFixed(decimals);
  }

  // Handler pro změnu hodnoty
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);

    // Pokud je hodnota prázdná a je povoleno mít prázdnou hodnotu
    if (newValue === '' && allowEmptyValue) {
      onChange('');
      return;
    }

    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) {
      // Kontrola limitů
      if (min !== undefined && parsed < min) return;
      if (max !== undefined && parsed > max) return;
      onChange(parsed);
    }
  };

  // Handler pro ztrátu focusu
  const handleBlur = () => {
    if (internalValue === '' && !allowEmptyValue) {
      const formatted = formatValue(0, precision);
      setInternalValue(formatted);
      onChange(0);
    } else if (internalValue !== '') {
      const formatted = formatValue(internalValue, precision);
      setInternalValue(formatted);
      onChange(parseFloat(formatted));
    }
  };

  return (
    <TextField
      {...textFieldProps}
      type="number"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      inputProps={{
        ...textFieldProps.inputProps,
        step,
        min,
        max,
      }}
    />
  );
};