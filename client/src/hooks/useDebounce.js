// client/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Hook para hacer debounce a un valor
 * @param {any} value - El valor a hacer debounce
 * @param {number} delay - El tiempo de delay en milisegundos
 * @returns {any} - El valor con debounce aplicado
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};