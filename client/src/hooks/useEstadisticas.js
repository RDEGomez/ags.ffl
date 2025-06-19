// 📁 hooks/useEstadisticas.js - Hook para manejar todas las estadísticas
import { useState, useCallback } from 'react';
import axiosInstance from '../config/axios';

export const useEstadisticas = () => {
  // 🔥 TODOS LOS ESTADOS AL INICIO
  const [loading, setLoading] = useState({
    torneos: false,
    tabla: false,
    tendencia: false,
    lideres: false,
    equipos: false,
    estadisticasCompletas: false
  });
  
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    torneosDisponibles: [],
    tablaPosiciones: [],
    tendenciaPuntos: [],
    lideresEstadisticas: {},
    equiposDisponibles: [],
    estadisticasEquipo: null
  });

  // 🔥 TODAS LAS FUNCIONES CON useCallback AL PRINCIPIO
  const obtenerTorneosDisponibles = useCallback(async () => {
    setLoading(prev => ({ ...prev, torneos: true }));
    setError(null);
    
    try {
      console.log('🔍 Obteniendo torneos disponibles...');
      console.log('📡 URL:', '/estadisticas/torneos-categorias');
      
      const response = await axiosInstance.get('/estadisticas/torneos-categorias');
      
      console.log('✅ Respuesta completa:', response.data);
      console.log('📊 Torneos obtenidos:', response.data.torneos?.length || 0);
      
      if (response.data.torneos?.length > 0) {
        response.data.torneos.forEach((torneo, i) => {
          console.log(`  🏆 Torneo ${i + 1}:`, {
            id: torneo._id,
            nombre: torneo.nombre,
            totalPartidos: torneo.totalPartidos,
            categorias: torneo.categorias?.length || 0,
            progreso: torneo.progreso || 0
          });
        });
      }
      
      setData(prev => ({
        ...prev,
        torneosDisponibles: response.data.torneos || []
      }));
      
      return response.data.torneos || [];
    } catch (error) {
      console.error('❌ Error obteniendo torneos:', error);
      console.error('📡 Error details:', {
        status: error.response?.status,
        message: error.response?.data?.mensaje || error.message,
        url: error.config?.url
      });
      
      const mensaje = error.response?.data?.mensaje || 'Error al obtener torneos disponibles';
      setError(mensaje);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, torneos: false }));
    }
  }, []);

  const obtenerEquiposDisponibles = useCallback(async (torneoId, categoria) => {
    // 🔥 VALIDACIÓN AL INICIO, PERO SIN EARLY RETURN EN HOOK
    const shouldFetch = torneoId && categoria;
    
    setLoading(prev => ({ ...prev, equipos: true }));
    setError(null);
    
    try {
      if (!shouldFetch) {
        setData(prev => ({ ...prev, equiposDisponibles: [] }));
        return [];
      }

      console.log(`🔍 Obteniendo equipos del torneo ${torneoId}, categoría ${categoria}...`);
      const response = await axiosInstance.get(`/estadisticas/equipos-torneo/${torneoId}/${categoria}`);
      
      console.log('✅ Equipos obtenidos:', response.data.equipos?.length || 0);
      setData(prev => ({
        ...prev,
        equiposDisponibles: response.data.equipos || []
      }));
      
      return response.data.equipos || [];
    } catch (error) {
      console.error('❌ Error obteniendo equipos:', error);
      const mensaje = error.response?.data?.mensaje || 'Error al obtener equipos';
      setError(mensaje);
      setData(prev => ({ ...prev, equiposDisponibles: [] }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, equipos: false }));
    }
  }, []);

  const obtenerTablaPosiciones = useCallback(async (torneoId, categoria) => {
    const shouldFetch = torneoId && categoria;
    
    setLoading(prev => ({ ...prev, tabla: true }));
    setError(null);
    
    try {
      if (!shouldFetch) {
        setData(prev => ({ ...prev, tablaPosiciones: [] }));
        return [];
      }

      console.log(`📊 Obteniendo tabla de posiciones: ${torneoId}/${categoria}...`);
      console.log('📡 URL:', `/estadisticas/tabla-posiciones/${torneoId}/${categoria}`);
      
      const response = await axiosInstance.get(`/estadisticas/tabla-posiciones/${torneoId}/${categoria}`);
      
      console.log('✅ Respuesta completa:', response.data);
      console.log('📊 Equipos en tabla:', response.data.tablaPosiciones?.length || 0);
      
      if (response.data.tablaPosiciones?.length > 0) {
        response.data.tablaPosiciones.forEach((equipo, i) => {
          console.log(`  🏈 ${i + 1}. ${equipo.equipo.nombre}:`, {
            victorias: equipo.victorias,
            derrotas: equipo.derrotas,
            partidosJugados: equipo.partidosJugados,
            totalPartidos: equipo.totalPartidos,
            partidosPendientes: equipo.partidosPendientes
          });
        });
      }
      
      setData(prev => ({
        ...prev,
        tablaPosiciones: response.data.tablaPosiciones || []
      }));
      
      return response.data.tablaPosiciones || [];
    } catch (error) {
      console.error('❌ Error obteniendo tabla:', error);
      console.error('📡 Error details:', {
        status: error.response?.status,
        message: error.response?.data?.mensaje || error.message,
        url: error.config?.url
      });
      
      const mensaje = error.response?.data?.mensaje || 'Error al obtener tabla de posiciones';
      setError(mensaje);
      setData(prev => ({ ...prev, tablaPosiciones: [] }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, tabla: false }));
    }
  }, []);

  const obtenerTendenciaPuntos = useCallback(async (equipoId, torneoId) => {
    const shouldFetch = equipoId && torneoId;
    
    setLoading(prev => ({ ...prev, tendencia: true }));
    setError(null);
    
    try {
      if (!shouldFetch) {
        setData(prev => ({ ...prev, tendenciaPuntos: [] }));
        return { tendencia: [], estadisticas: {} };
      }

      console.log(`📈 Obteniendo tendencia de puntos: ${equipoId}/${torneoId}...`);
      const response = await axiosInstance.get(`/estadisticas/tendencia-puntos/${equipoId}/${torneoId}`);
      
      console.log('✅ Tendencia obtenida:', response.data.tendencia?.length || 0, 'jornadas');
      setData(prev => ({
        ...prev,
        tendenciaPuntos: response.data.tendencia || []
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo tendencia:', error);
      const mensaje = error.response?.data?.mensaje || 'Error al obtener tendencia de puntos';
      setError(mensaje);
      setData(prev => ({ ...prev, tendenciaPuntos: [] }));
      return { tendencia: [], estadisticas: {} };
    } finally {
      setLoading(prev => ({ ...prev, tendencia: false }));
    }
  }, []);

  const obtenerLideresEstadisticas = useCallback(async (equipoId, torneoId, tipo) => {
    const shouldFetch = equipoId && torneoId && tipo;
    
    setLoading(prev => ({ ...prev, lideres: true }));
    
    try {
      if (!shouldFetch) {
        return [];
      }

      console.log(`🏆 Obteniendo líderes ${tipo}: ${equipoId}/${torneoId}...`);
      const response = await axiosInstance.get(`/estadisticas/lideres/${equipoId}/${torneoId}/${tipo}`);
      
      console.log(`✅ Líderes ${tipo} obtenidos:`, response.data.lideres?.length || 0);
      setData(prev => ({
        ...prev,
        lideresEstadisticas: {
          ...prev.lideresEstadisticas,
          [tipo]: response.data.lideres || []
        }
      }));
      
      return response.data.lideres || [];
    } catch (error) {
      console.error(`❌ Error obteniendo líderes ${tipo}:`, error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, lideres: false }));
    }
  }, []);

  const obtenerEstadisticasCompletas = useCallback(async (equipoId, torneoId) => {
    const shouldFetch = equipoId && torneoId;
    
    setLoading(prev => ({ ...prev, estadisticasCompletas: true }));
    setError(null);
    
    try {
      if (!shouldFetch) {
        setData(prev => ({ ...prev, estadisticasEquipo: null }));
        return null;
      }

      console.log(`📊 Obteniendo estadísticas completas: ${equipoId}/${torneoId}...`);
      const response = await axiosInstance.get(`/estadisticas/equipo/${equipoId}/${torneoId}`);
      
      console.log('✅ Estadísticas completas obtenidas');
      setData(prev => ({
        ...prev,
        estadisticasEquipo: response.data
      }));
      
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas completas:', error);
      const mensaje = error.response?.data?.mensaje || 'Error al obtener estadísticas del equipo';
      setError(mensaje);
      setData(prev => ({ ...prev, estadisticasEquipo: null }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, estadisticasCompletas: false }));
    }
  }, []);

  // 🔥 FUNCIÓN obtenerTodosLideres CORREGIDA
  const obtenerTodosLideres = useCallback(async (equipoId, torneoId) => {
    const shouldFetch = equipoId && torneoId;
    
    setLoading(prev => ({ ...prev, lideres: true }));
    
    try {
      if (!shouldFetch) {
        return {};
      }

      console.log(`🏆 Obteniendo todos los líderes: ${equipoId}/${torneoId}...`);
      
      // 🔥 CAMBIO CRÍTICO: 'pases' → 'qbrating'
      const tiposLideres = ['qbrating', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
      
      const promesasLideres = tiposLideres.map(tipo => 
        axiosInstance.get(`/estadisticas/lideres/${equipoId}/${torneoId}/${tipo}`)
          .then(response => ({ tipo, datos: response.data.lideres || [] }))
          .catch(error => {
            console.error(`❌ Error obteniendo líderes ${tipo}:`, error);
            return { tipo, datos: [] };
          })
      );
      
      const resultados = await Promise.all(promesasLideres);
      
      const lideresCompletos = {};
      resultados.forEach(({ tipo, datos }) => {
        lideresCompletos[tipo] = datos;
      });
      
      console.log('✅ Todos los líderes obtenidos:', Object.keys(lideresCompletos));
      setData(prev => ({
        ...prev,
        lideresEstadisticas: lideresCompletos
      }));
      
      return lideresCompletos;
    } catch (error) {
      console.error('❌ Error obteniendo líderes:', error);
      return {};
    } finally {
      setLoading(prev => ({ ...prev, lideres: false }));
    }
  }, []);

  const validarDisponibilidad = useCallback(async (torneoId, categoria) => {
    const shouldFetch = torneoId && categoria;
    
    try {
      if (!shouldFetch) {
        return { disponible: false };
      }

      console.log(`🔍 Validando disponibilidad: ${torneoId}/${categoria}...`);
      const response = await axiosInstance.get(`/estadisticas/validar/${torneoId}/${categoria}`);
      
      console.log('✅ Validación completada:', response.data.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE');
      return response.data;
    } catch (error) {
      console.error('❌ Error validando disponibilidad:', error);
      return { disponible: false, error: error.message };
    }
  }, []);

  const limpiarDatos = useCallback(() => {
    console.log('🧹 Limpiando datos de estadísticas');
    setData({
      torneosDisponibles: [],
      tablaPosiciones: [],
      tendenciaPuntos: [],
      lideresEstadisticas: {},
      equiposDisponibles: [],
      estadisticasEquipo: null
    });
    setError(null);
  }, []);

  const refrescarTodo = useCallback(async (torneoId, categoria, equipoId) => {
    console.log('🔄 Refrescando todos los datos...');
    
    try {
      // Siempre obtener torneos
      await obtenerTorneosDisponibles();
      
      // Solo si hay torneo y categoría
      if (torneoId && categoria) {
        await Promise.all([
          obtenerTablaPosiciones(torneoId, categoria),
          obtenerEquiposDisponibles(torneoId, categoria)
        ]);
      }
      
      // Solo si hay equipo seleccionado
      if (equipoId && torneoId) {
        await Promise.all([
          obtenerTendenciaPuntos(equipoId, torneoId),
          obtenerTodosLideres(equipoId, torneoId)
        ]);
      }
      
      console.log('✅ Refresco completado');
    } catch (error) {
      console.error('❌ Error en refresco:', error);
    }
  }, [obtenerTorneosDisponibles, obtenerTablaPosiciones, obtenerEquiposDisponibles, obtenerTendenciaPuntos, obtenerTodosLideres]);

  // 🔥 RETURN AL FINAL
  return {
    loading,
    error,
    data,
    obtenerTorneosDisponibles,
    obtenerEquiposDisponibles,
    obtenerTablaPosiciones,
    obtenerTendenciaPuntos,
    obtenerLideresEstadisticas,
    obtenerEstadisticasCompletas,
    obtenerTodosLideres,
    validarDisponibilidad,
    limpiarDatos,
    refrescarTodo
  };
};