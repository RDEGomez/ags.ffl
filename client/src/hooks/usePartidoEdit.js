import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../config/axios';

export const usePartidoEdit = (partidoId) => {
  // 📊 Estados principales
  const [partido, setPartido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState({});
  const [historial, setHistorial] = useState([]);

  // 🔄 Cargar partido inicial
  const cargarPartido = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando partido:', partidoId);
      const response = await axiosInstance.get(`/partidos/${partidoId}`);
      
      console.log('✅ Partido cargado:', response.data.partido);
      setPartido(response.data.partido);
      
    } catch (err) {
      console.error('❌ Error al cargar partido:', err);
      setError(
        err.response?.data?.mensaje || 
        'Error al cargar el partido'
      );
    } finally {
      setLoading(false);
    }
  }, [partidoId]);

  // 📝 Establecer campo modificado
  const setCampo = useCallback((campo, valor) => {
    console.log(`📝 Modificando campo ${campo}:`, valor);
    
    setCambios(prev => {
      const nuevosCambios = { ...prev };
      
      // Manejar casos especiales
      if (campo === 'marcador') {
        nuevosCambios.marcador = {
          ...partido?.marcador,
          ...valor
        };
      } else if (campo === 'sede') {
        nuevosCambios.sede = {
          ...partido?.sede,
          ...valor
        };
      } else {
        nuevosCambios[campo] = valor;
      }
      
      // Si el valor es igual al original, remover del tracking
      if (campo === 'marcador') {
        const original = partido?.marcador;
        if (original && 
            nuevosCambios.marcador.local === original.local && 
            nuevosCambios.marcador.visitante === original.visitante) {
          delete nuevosCambios.marcador;
        }
      } else if (campo === 'sede') {
        const original = partido?.sede;
        if (original && nuevosCambios.sede.nombre === original.nombre) {
          delete nuevosCambios.sede;
        }
      } else if (nuevosCambios[campo] === partido?.[campo]) {
        delete nuevosCambios[campo];
      }
      
      console.log('📊 Cambios actuales:', nuevosCambios);
      return nuevosCambios;
    });
  }, [partido]);

  // 💾 Guardar cambios
  const guardarCambios = useCallback(async () => {
    if (Object.keys(cambios).length === 0) {
      console.log('⚠️ No hay cambios que guardar');
      return true;
    }

    try {
      setGuardando(true);
      setError(null);

      console.log('💾 Guardando cambios:', cambios);

      // Preparar datos para envío
      const datosParaEnviar = { ...cambios };
      
      // Formatear fecha si está en los cambios
      if (datosParaEnviar.fechaHora) {
        datosParaEnviar.fechaHora = new Date(datosParaEnviar.fechaHora).toISOString();
      }

      const response = await axiosInstance.put(`/partidos/${partidoId}`, datosParaEnviar);
      
      console.log('✅ Cambios guardados exitosamente:', response.data);
      
      // Actualizar partido con los nuevos datos
      setPartido(response.data.partido);
      
      // Limpiar cambios pendientes
      setCambios({});
      
      return true;
      
    } catch (err) {
      console.error('❌ Error al guardar cambios:', err);
      setError(
        err.response?.data?.mensaje || 
        'Error al guardar los cambios'
      );
      return false;
    } finally {
      setGuardando(false);
    }
  }, [partidoId, cambios]);

  // 📋 Cargar historial del partido
  const cargarHistorial = useCallback(async () => {
    try {
      console.log('📋 Cargando historial del partido...');
      const response = await axiosInstance.get(`/partidos/${partidoId}/historial`);
      
      console.log('✅ Historial cargado:', response.data.historial);
      setHistorial(response.data.historial || []);
      
    } catch (err) {
      console.error('❌ Error al cargar historial:', err);
      // No es crítico, solo log
      setHistorial([]);
    }
  }, [partidoId]);

  // 🔄 Resetear cambios
  const resetearCambios = useCallback(() => {
    console.log('🔄 Reseteando cambios');
    setCambios({});
  }, []);

  // 🎯 Obtener valor actual de un campo (con cambios aplicados)
  const getValorCampo = useCallback((campo) => {
    if (cambios.hasOwnProperty(campo)) {
      return cambios[campo];
    }
    return partido?.[campo];
  }, [cambios, partido]);

  // 📊 Verificar si hay cambios pendientes
  const tieneCambiosPendientes = Object.keys(cambios).length > 0;

  // 🔄 Efecto para cargar partido inicial
  useEffect(() => {
    if (partidoId) {
      cargarPartido();
    }
  }, [partidoId, cargarPartido]);

  // 🧹 Limpiar cambios si cambia el partido
  useEffect(() => {
    setCambios({});
  }, [partido?._id]);

  // 📈 Estado de validación
  const validarCambios = useCallback(() => {
    const errores = [];

    // Validar fecha
    if (cambios.fechaHora) {
      const fecha = new Date(cambios.fechaHora);
      if (isNaN(fecha.getTime())) {
        errores.push('Fecha inválida');
      }
    }

    // Validar duración
    if (cambios.duracionMinutos !== undefined) {
      if (cambios.duracionMinutos < 20 || cambios.duracionMinutos > 120) {
        errores.push('La duración debe estar entre 20 y 120 minutos');
      }
    }

    // Validar marcador
    if (cambios.marcador) {
      const { local, visitante } = cambios.marcador;
      if (local < 0 || visitante < 0) {
        errores.push('El marcador no puede ser negativo');
      }
      if (local > 99 || visitante > 99) {
        errores.push('El marcador no puede ser mayor a 99');
      }
    }

    return errores;
  }, [cambios]);

  // 🎯 Funciones específicas para marcador
  const actualizarMarcador = useCallback(async (local, visitante, motivo = '') => {
    try {
      setGuardando(true);
      setError(null);

      console.log('🎯 Actualizando marcador:', { local, visitante, motivo });

      const response = await axiosInstance.put(`/partidos/${partidoId}/marcador`, {
        local: parseInt(local),
        visitante: parseInt(visitante),
        motivo
      });

      console.log('✅ Marcador actualizado:', response.data);
      
      // Actualizar partido con los nuevos datos
      setPartido(response.data.partido);
      
      // Remover cambios de marcador si existen
      setCambios(prev => {
        const nuevos = { ...prev };
        delete nuevos.marcador;
        return nuevos;
      });

      return true;
    } catch (err) {
      console.error('❌ Error al actualizar marcador:', err);
      setError(
        err.response?.data?.mensaje || 
        'Error al actualizar el marcador'
      );
      return false;
    } finally {
      setGuardando(false);
    }
  }, [partidoId]);

  // 🎮 Funciones de estado
  const cambiarEstado = useCallback(async (nuevoEstado, motivo = '') => {
    try {
      setGuardando(true);
      setError(null);

      console.log('🎮 Cambiando estado a:', nuevoEstado);

      const response = await axiosInstance.put(`/partidos/${partidoId}/estado`, {
        estado: nuevoEstado,
        motivo
      });

      console.log('✅ Estado cambiado:', response.data);
      
      // Actualizar partido con los nuevos datos
      setPartido(response.data.partido);
      
      // Remover cambios de estado si existen
      setCambios(prev => {
        const nuevos = { ...prev };
        delete nuevos.estado;
        return nuevos;
      });

      return true;
    } catch (err) {
      console.error('❌ Error al cambiar estado:', err);
      setError(
        err.response?.data?.mensaje || 
        'Error al cambiar el estado'
      );
      return false;
    } finally {
      setGuardando(false);
    }
  }, [partidoId]);

  // 📊 Estado calculado
  const estadoFormulario = {
    esValido: validarCambios().length === 0,
    errores: validarCambios(),
    tieneCambios: tieneCambiosPendientes,
    puedeGuardar: tieneCambiosPendientes && validarCambios().length === 0 && !guardando
  };

  // 🔄 Recargar partido
  const recargarPartido = useCallback(() => {
    cargarPartido();
  }, [cargarPartido]);

  return {
    // 📊 Estado
    partido,
    loading,
    error,
    guardando,
    cambios,
    historial,
    estadoFormulario,
    
    // 🎯 Funciones principales
    setCampo,
    guardarCambios,
    resetearCambios,
    cargarHistorial,
    recargarPartido,
    
    // 🎮 Funciones específicas
    actualizarMarcador,
    cambiarEstado,
    
    // 🔍 Helpers
    getValorCampo,
    validarCambios,
    
    // 📈 Estado computado
    tieneCambiosPendientes
  };
};