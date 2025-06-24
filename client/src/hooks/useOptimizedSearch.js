// client/src/hooks/useOptimizedSearch.js
import { useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Hook para búsquedas optimizadas con debounce y índices pre-calculados
 * @param {Array} data - Array de datos a filtrar
 * @param {string} searchTerm - Término de búsqueda
 * @param {Array} searchFields - Campos donde buscar
 * @param {number} delay - Delay del debounce en ms
 * @returns {Array} - Datos filtrados
 */
export const useOptimizedSearch = (data, searchTerm, searchFields, delay = 300) => {
  const debouncedTerm = useDebounce(searchTerm, delay);

  return useMemo(() => {
    if (!debouncedTerm.trim() || !Array.isArray(data)) return data;
    
    const term = debouncedTerm.toLowerCase().trim();
    
    return data.filter(item => {
      return searchFields.some(field => {
        const value = getNestedValue(item, field);
        return value && value.toLowerCase().includes(term);
      });
    });
  }, [data, debouncedTerm, searchFields]);
};

/**
 * Hook para crear índices de búsqueda pre-calculados
 * @param {Array} data - Array de datos
 * @param {Function} indexBuilder - Función que construye el índice para cada item
 * @returns {Array} - Datos con índices pre-calculados
 */
export const usePrecomputedIndex = (data, indexBuilder) => {
  return useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      _searchIndex: indexBuilder(item),
      _originalItem: item
    }));
  }, [data, indexBuilder]);
};

/**
 * Hook para búsquedas usando índices pre-calculados
 * @param {Array} dataWithIndex - Datos con índices pre-calculados
 * @param {string} searchTerm - Término de búsqueda
 * @param {number} delay - Delay del debounce
 * @returns {Array} - Datos filtrados
 */
export const useIndexedSearch = (dataWithIndex, searchTerm, delay = 300) => {
  const debouncedTerm = useDebounce(searchTerm, delay);

  return useMemo(() => {
    if (!debouncedTerm.trim() || !Array.isArray(dataWithIndex)) return dataWithIndex;
    
    const term = debouncedTerm.toLowerCase().trim();
    
    return dataWithIndex.filter(item => 
      item._searchIndex && item._searchIndex.includes(term)
    );
  }, [dataWithIndex, debouncedTerm]);
};

/**
 * Función helper para acceder a propiedades anidadas
 * @param {Object} obj - Objeto base
 * @param {string} path - Ruta de la propiedad (ej: 'user.name')
 * @returns {any} - Valor de la propiedad
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return current[key];
    }
    return null;
  }, obj);
};

/**
 * Hook para ordenamiento optimizado
 * @param {Array} data - Datos a ordenar
 * @param {string} sortBy - Campo de ordenamiento (formato: "campo_orden")
 * @param {Object} customSorters - Funciones de ordenamiento personalizadas
 * @returns {Array} - Datos ordenados
 */
export const useOptimizedSort = (data, sortBy, customSorters = {}) => {
  return useMemo(() => {
    if (!Array.isArray(data) || !sortBy) return data;
    
    const [field, order] = sortBy.split('_');
    
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      // Usar sorter personalizado si existe
      if (customSorters[field]) {
        const customResult = customSorters[field](a, b, order);
        return customResult;
      }
      
      // Sorter por defecto
      valueA = getNestedValue(a, field) || '';
      valueB = getNestedValue(b, field) || '';
      
      // Manejar diferentes tipos de datos
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      if (valueA instanceof Date && valueB instanceof Date) {
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Comparación de strings
      valueA = valueA.toString().toLowerCase();
      valueB = valueB.toString().toLowerCase();
      
      if (valueA === valueB) return 0;
      
      const comparison = valueA < valueB ? -1 : 1;
      return order === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, customSorters]);
};