// 📁 client/src/hooks/useEstadisticasIndividuales.js - NUEVO HOOK PERSONALIZADO

import { useState, useCallback } from 'react';
import axiosInstance from '../config/axios';

export const useEstadisticasIndividuales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    lideresIndividuales: {}
  });

  // 🔥 OBTENER TODOS LOS LÍDERES INDIVIDUALES
  const obtenerTodosLideresIndividuales = useCallback(async (torneoId, categoria) => {
    if (!torneoId || !categoria) {
      console.warn('🚫 torneoId y categoria son requeridos para obtener líderes individuales');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🏆 Obteniendo todos los líderes individuales...', { torneoId, categoria });
      
      const response = await axiosInstance.get(
        `/estadisticas/todos-lideres-individuales/${torneoId}/${categoria}`
      );

      if (response.data?.lideresIndividuales) {
        setData(prevData => ({
          ...prevData,
          lideresIndividuales: response.data.lideresIndividuales,
          torneo: response.data.torneo,
          categoria: response.data.categoria,
          fechaConsulta: response.data.fechaConsulta
        }));
        
        console.log('✅ Líderes individuales obtenidos correctamente');
        console.log('📊 Tipos disponibles:', Object.keys(response.data.lideresIndividuales));
      } else {
        console.warn('⚠️ Respuesta sin datos de líderes individuales');
      }

    } catch (error) {
      console.error('❌ Error al obtener líderes individuales:', error);
      const mensajeError = error.response?.data?.mensaje || error.message || 'Error desconocido';
      setError(`Error al obtener líderes individuales: ${mensajeError}`);
      
      // Limpiar datos en caso de error
      setData(prevData => ({
        ...prevData,
        lideresIndividuales: {}
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 OBTENER LÍDERES INDIVIDUALES POR TIPO ESPECÍFICO
  const obtenerLideresIndividualesPorTipo = useCallback(async (torneoId, categoria, tipo) => {
    if (!torneoId || !categoria || !tipo) {
      console.warn('🚫 torneoId, categoria y tipo son requeridos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('👑 Obteniendo líderes individuales por tipo...', { torneoId, categoria, tipo });
      
      const response = await axiosInstance.get(
        `/estadisticas/lideres-individuales/${torneoId}/${categoria}/${tipo}`
      );

      if (response.data?.lideres) {
        setData(prevData => ({
          ...prevData,
          lideresIndividuales: {
            ...prevData.lideresIndividuales,
            [tipo]: response.data
          }
        }));
        
        console.log(`✅ Líderes de ${tipo} obtenidos correctamente`);
        console.log(`📊 Total líderes: ${response.data.lideres.length}`);
        
        return response.data;
      } else {
        console.warn('⚠️ Respuesta sin datos de líderes');
      }

    } catch (error) {
      console.error(`❌ Error al obtener líderes de ${tipo}:`, error);
      const mensajeError = error.response?.data?.mensaje || error.message || 'Error desconocido';
      setError(`Error al obtener líderes de ${tipo}: ${mensajeError}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 LIMPIAR DATOS
  const limpiarDatosIndividuales = useCallback(() => {
    console.log('🧹 Limpiando datos de estadísticas individuales...');
    setData({
      lideresIndividuales: {}
    });
    setError(null);
  }, []);

  // 🔥 REFRESCAR TODOS LOS DATOS
  const refrescarLideresIndividuales = useCallback(async (torneoId, categoria) => {
    console.log('🔄 Refrescando todos los líderes individuales...');
    await obtenerTodosLideresIndividuales(torneoId, categoria);
  }, [obtenerTodosLideresIndividuales]);

  // 🔥 VALIDAR SI HAY DATOS DISPONIBLES
  const tieneEstadisticasIndividuales = useCallback(() => {
    const lideres = data.lideresIndividuales;
    if (!lideres || Object.keys(lideres).length === 0) {
      return false;
    }

    // Verificar si al menos uno de los tipos tiene líderes
    return Object.values(lideres).some(tipoData => 
      tipoData?.lideres && tipoData.lideres.length > 0
    );
  }, [data.lideresIndividuales]);

  // 🔥 OBTENER ESTADÍSTICAS DE UN TIPO ESPECÍFICO
  const obtenerEstadisticasTipo = useCallback((tipo) => {
    return data.lideresIndividuales[tipo] || { lideres: [], totalJugadoresConStats: 0 };
  }, [data.lideresIndividuales]);

  // 🔥 OBTENER EL LÍDER DE UN TIPO
  const obtenerLiderTipo = useCallback((tipo) => {
    const estadisticas = obtenerEstadisticasTipo(tipo);
    return estadisticas.lideres?.[0] || null;
  }, [obtenerEstadisticasTipo]);

  // 🔥 OBTENER TOP 3 DE UN TIPO
  const obtenerTop3Tipo = useCallback((tipo) => {
    const estadisticas = obtenerEstadisticasTipo(tipo);
    return estadisticas.lideres?.slice(0, 3) || [];
  }, [obtenerEstadisticasTipo]);

  return {
    // Estados
    loading,
    error,
    data,
    
    // Funciones principales
    obtenerTodosLideresIndividuales,
    obtenerLideresIndividualesPorTipo,
    refrescarLideresIndividuales,
    limpiarDatosIndividuales,
    
    // Funciones de utilidad
    tieneEstadisticasIndividuales,
    obtenerEstadisticasTipo,
    obtenerLiderTipo,
    obtenerTop3Tipo,
    
    // Datos específicos
    lideresIndividuales: data.lideresIndividuales
  };
};