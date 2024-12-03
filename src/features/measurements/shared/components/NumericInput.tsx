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
  const formatValue = React.useCallback((val: number | string): string => {
    if (val === '' || val === '-') return val;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return allowEmptyValue ? '' : '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: false
    });
  }, [allowEmptyValue, precision]);

  const [internalValue, setInternalValue] = React.useState<string>('');
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setInternalValue(formatValue(value));
    }
  }, [value, formatValue, isEditing]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    if (newValue === '' || newValue === '-' || newValue === '.') {
      setInternalValue(newValue);
      if (allowEmptyValue) {
        onChange('');
      }
      return;
    }

    const sanitizedValue = newValue.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(sanitizedValue);
    
    setInternalValue(sanitizedValue);

    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) return;
      if (max !== undefined && parsed > max) return;
      onChange(parsed);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    const rawValue = value.toString();
    setInternalValue(rawValue);
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    if (internalValue === '' || internalValue === '-' || internalValue === '.') {
      if (!allowEmptyValue) {
        const formatted = formatValue(0);
        setInternalValue(formatted);
        onChange(0);
      }
      return;
    }

    const parsed = parseFloat(internalValue);
    if (!isNaN(parsed)) {
      const formatted = formatValue(parsed);
      setInternalValue(formatted);
      onChange(parsed);
    } else if (!allowEmptyValue) {
      setInternalValue(formatValue(0));
      onChange(0);
    }
  };

  const handleStep = (direction: 'up' | 'down') => {
    const currentValue = parseFloat(internalValue) || 0;
    const newValue = direction === 'up' ? currentValue + step : currentValue - step;
    
    if (min !== undefined && newValue < min) return;
    if (max !== undefined && newValue > max) return;
    
    const rounded = Number(newValue.toFixed(precision));
    setInternalValue(formatValue(rounded));
    onChange(rounded);
  };

  return (
    <TextField
      {...textFieldProps}
      type="number"
      value={internalValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      inputProps={{
        ...textFieldProps.inputProps,
        step,
        min,
        max,
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          if (textFieldProps.inputProps?.onKeyDown) {
            (textFieldProps.inputProps.onKeyDown as React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>)(e);
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleStep('up');
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleStep('down');
          }
        },
      }}
    />
  );
};