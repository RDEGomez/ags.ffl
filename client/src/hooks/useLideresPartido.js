import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../config/axios';

export const useLideresPartido = (partidoId) => {
  // 📊 Estados principales
  const [lideres, setLideres] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partido, setPartido] = useState(null);

  // 🔄 Cargar líderes del partido
  const cargarLideres = useCallback(async () => {
    if (!partidoId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏆 Cargando líderes del partido:', partidoId);
      
      const response = await axiosInstance.get(`/estadisticas/lideres-partido/${partidoId}`);
      
      console.log('✅ Líderes cargados:', response.data);
      
      setLideres(response.data.lideres);
      setPartido(response.data.partido);
      
    } catch (err) {
      console.error('❌ Error al cargar líderes:', err);
      
      // 🎯 Manejo específico de errores
      if (err.response?.status === 404) {
        setError('Partido no encontrado');
      } else if (err.response?.status === 403) {
        setError('No tienes permisos para ver estas estadísticas');
      } else if (err.response?.data?.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('Error al cargar los líderes del partido');
      }
      
      setLideres(null);
      setPartido(null);
    } finally {
      setLoading(false);
    }
  }, [partidoId]);

  // 🔄 Recargar datos
  const recargar = useCallback(() => {
    cargarLideres();
  }, [cargarLideres]);

  // 📊 Obtener líderes de una categoría específica
  const getLideresPorCategoria = useCallback((categoria) => {
    return lideres?.[categoria] || [];
  }, [lideres]);

  // 🏆 Obtener el líder principal de una categoría
  const getLiderPrincipal = useCallback((categoria) => {
    const lideresCategoria = getLideresPorCategoria(categoria);
    return lideresCategoria.length > 0 ? lideresCategoria[0] : null;
  }, [getLideresPorCategoria]);

  // 📈 Obtener estadísticas resumidas
  const getEstadisticasResumen = useCallback(() => {
    if (!lideres) return null;

    const categorias = Object.keys(lideres);
    let totalJugadoresConEstadisticas = 0;
    let categoriasConLideres = 0;

    const resumenPorCategoria = {};

    categorias.forEach(categoria => {
      const lideresCategoria = lideres[categoria] || [];
      
      if (lideresCategoria.length > 0) {
        categoriasConLideres++;
        totalJugadoresConEstadisticas += lideresCategoria.length;
        
        resumenPorCategoria[categoria] = {
          totalLideres: lideresCategoria.length,
          mejorValor: lideresCategoria[0]?.valor || 0,
          liderPrincipal: lideresCategoria[0]
        };
      }
    });

    return {
      totalCategorias: categorias.length,
      categoriasConLideres,
      totalJugadoresConEstadisticas,
      resumenPorCategoria
    };
  }, [lideres]);

  // 🔍 Buscar jugador en los líderes
  const buscarJugadorEnLideres = useCallback((jugadorId) => {
    if (!lideres || !jugadorId) return [];

    const apariciones = [];

    Object.entries(lideres).forEach(([categoria, lideresCategoria]) => {
      lideresCategoria.forEach((lider, posicion) => {
        if (lider.jugador?._id === jugadorId) {
          apariciones.push({
            categoria,
            posicion: posicion + 1,
            valor: lider.valor,
            lider
          });
        }
      });
    });

    return apariciones.sort((a, b) => a.posicion - b.posicion);
  }, [lideres]);

  // 🏅 Obtener el mejor jugador general (más apariciones en top 3)
  const getMejorJugadorGeneral = useCallback(() => {
    if (!lideres) return null;

    const conteoJugadores = new Map();

    Object.values(lideres).forEach(lideresCategoria => {
      lideresCategoria.forEach((lider, posicion) => {
        const jugadorId = lider.jugador?._id;
        if (!jugadorId) return;

        if (!conteoJugadores.has(jugadorId)) {
          conteoJugadores.set(jugadorId, {
            jugador: lider.jugador,
            equipo: lider.equipo,
            apariciones: 0,
            puntajeTotal: 0,
            categorias: []
          });
        }

        const data = conteoJugadores.get(jugadorId);
        data.apariciones++;
        
        // Puntaje: 3 puntos por primer lugar, 2 por segundo, 1 por tercero
        const puntaje = posicion === 0 ? 3 : posicion === 1 ? 2 : 1;
        data.puntajeTotal += puntaje;
        
        data.categorias.push({
          categoria: Object.keys(lideres).find(cat => lideres[cat].includes(lider)),
          posicion: posicion + 1,
          valor: lider.valor
        });
      });
    });

    if (conteoJugadores.size === 0) return null;

    // Encontrar el jugador con mejor puntaje
    let mejorJugador = null;
    let mejorPuntaje = 0;

    conteoJugadores.forEach(data => {
      if (data.puntajeTotal > mejorPuntaje) {
        mejorPuntaje = data.puntajeTotal;
        mejorJugador = data;
      }
    });

    return mejorJugador;
  }, [lideres]);

  // 📊 Verificar si hay datos de estadísticas
  const tieneDatos = !loading && !error && lideres && Object.keys(lideres).length > 0;

  // 🎯 Verificar si una categoría específica tiene líderes
  const tienelideresPorCategoria = useCallback((categoria) => {
    return getLideresPorCategoria(categoria).length > 0;
  }, [getLideresPorCategoria]);

  // 🔄 Efecto para cargar datos iniciales
  useEffect(() => {
    cargarLideres();
  }, [cargarLideres]);

  // 🧹 Limpiar datos cuando cambia el partidoId
  useEffect(() => {
    setLideres(null);
    setPartido(null);
    setError(null);
  }, [partidoId]);

  return {
    // 📊 Datos principales
    lideres,
    partido,
    loading,
    error,
    tieneDatos,

    // 🔄 Funciones de control
    recargar,
    cargarLideres,

    // 🔍 Funciones de consulta
    getLideresPorCategoria,
    getLiderPrincipal,
    buscarJugadorEnLideres,
    tienelideresPorCategoria,

    // 📈 Análisis y estadísticas
    getEstadisticasResumen,
    getMejorJugadorGeneral,

    // 📊 Estado computado
    totalCategorias: lideres ? Object.keys(lideres).length : 0,
    categoriasConDatos: lideres ? Object.keys(lideres).filter(cat => 
      lideres[cat] && lideres[cat].length > 0
    ).length : 0
  };
};