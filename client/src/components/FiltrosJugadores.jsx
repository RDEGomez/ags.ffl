import { useEffect, useMemo, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import axiosInstance from '../config/axios';
import { getCategoryName } from '../helpers/mappings';

const categorias = [
  { value: 'mixgold', label: 'Mixto Golden' },
  { value: 'mixsilv', label: 'Mixto Silver' },
  { value: 'vargold', label: 'Varonil Golden' },
  { value: 'varsilv', label: 'Varonil Silver' },
  { value: 'femgold', label: 'Femenil Golden' },
  { value: 'femsilv', label: 'Femenil Silver' },
  { value: 'varmast', label: 'Varonil Master' },
  { value: 'femmast', label: 'Femenil Master' },
  { value: 'tocho7v7', label: 'Tocho 7v7' },
  { value: 'U-8', label: 'U-8' },
  { value: 'U-10', label: 'U-10' },
  { value: 'U-12', label: 'U-12' },
  { value: 'U-14', label: 'U-14' },
  { value: 'U-16', label: 'U-16' },
  { value: 'U-18', label: 'U-18' }
];

// 🔥 FUNCIÓN DE LOGGING PARA FILTROS
const logFiltro = (context, data, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    'ERROR': '❌',
    'WARN': '⚠️', 
    'INFO': '✅',
    'DEBUG': '🔍'
  }[level] || '📝';
  
  console.log(`[${timestamp}] ${prefix} FILTROS_JUGADORES | ${context}:`, data);
};

// 🔥 FUNCIÓN DEFENSIVA PARA OBTENER CATEGORÍAS DE USUARIO
const getCategoriasUsuario = (usuario) => {
  logFiltro('GET_CATEGORIAS_USUARIO_INICIO', { usuarioId: usuario?._id });
  
  if (!usuario) {
    logFiltro('USUARIO_NULL', {}, 'WARN');
    return [];
  }
  
  if (!usuario._id) {
    logFiltro('USUARIO_SIN_ID', { usuario }, 'WARN');
    return [];
  }
  
  if (!Array.isArray(usuario.equipos)) {
    logFiltro('EQUIPOS_NO_ARRAY', { 
      usuarioId: usuario._id, 
      equipos: usuario.equipos,
      tipoEquipos: typeof usuario.equipos
    }, 'WARN');
    return [];
  }
  
  const categorias = [];
  
  usuario.equipos.forEach((equipoRelacion, index) => {
    try {
      logFiltro('PROCESANDO_EQUIPO_RELACION', { 
        usuarioId: usuario._id, 
        index, 
        equipoRelacion 
      });
      
      // Validación de la relación
      if (!equipoRelacion) {
        logFiltro('EQUIPO_RELACION_NULL', { 
          usuarioId: usuario._id, 
          index 
        }, 'WARN');
        return;
      }
      
      // Validación del equipo dentro de la relación
      if (!equipoRelacion.equipo) {
        logFiltro('EQUIPO_EN_RELACION_NULL', { 
          usuarioId: usuario._id, 
          index, 
          equipoRelacion 
        }, 'WARN');
        return;
      }
      
      // El equipo puede venir como objeto completo o como ID string
      let equipo = equipoRelacion.equipo;
      
      // Si es string (ID), no tenemos la categoría
      if (typeof equipo === 'string') {
        logFiltro('EQUIPO_COMO_STRING_ID', { 
          usuarioId: usuario._id, 
          equipoId: equipo 
        }, 'WARN');
        return; // No podemos obtener categoría de un ID
      }
      
      // Si es objeto, debe tener _id y categoria
      if (typeof equipo !== 'object') {
        logFiltro('EQUIPO_TIPO_INVALIDO', { 
          usuarioId: usuario._id, 
          equipoTipo: typeof equipo,
          equipo 
        }, 'WARN');
        return;
      }
      
      // Validar que el objeto equipo tenga las propiedades necesarias
      if (!equipo._id) {
        logFiltro('EQUIPO_SIN_ID', { 
          usuarioId: usuario._id, 
          equipo 
        }, 'WARN');
        return;
      }
      
      if (!equipo.categoria) {
        logFiltro('EQUIPO_SIN_CATEGORIA', { 
          usuarioId: usuario._id, 
          equipoId: equipo._id,
          equipo 
        }, 'WARN');
        return;
      }
      
      // Si llegamos aquí, tenemos una categoría válida
      categorias.push(equipo.categoria);
      
      logFiltro('CATEGORIA_AGREGADA', { 
        usuarioId: usuario._id, 
        equipoId: equipo._id,
        categoria: equipo.categoria 
      });
      
    } catch (error) {
      logFiltro('ERROR_PROCESANDO_EQUIPO_RELACION', {
        usuarioId: usuario._id,
        index,
        equipoRelacion,
        error: error.message,
        stack: error.stack
      }, 'ERROR');
    }
  });
  
  // Eliminar duplicados
  const categoriasUnicas = [...new Set(categorias)];
  
  logFiltro('CATEGORIAS_USUARIO_FINAL', { 
    usuarioId: usuario._id, 
    categorias: categoriasUnicas 
  });
  
  return categoriasUnicas;
};

// 🔥 FUNCIÓN DEFENSIVA PARA VALIDAR JUGADOR
const validarJugador = (jugador, index) => {
  logFiltro('VALIDANDO_JUGADOR', { index, jugadorId: jugador?._id });
  
  if (!jugador) {
    logFiltro('JUGADOR_NULL', { index }, 'WARN');
    return false;
  }
  
  if (typeof jugador !== 'object') {
    logFiltro('JUGADOR_NO_OBJECT', { 
      index, 
      jugador, 
      tipo: typeof jugador 
    }, 'WARN');
    return false;
  }
  
  if (!jugador._id) {
    logFiltro('JUGADOR_SIN_ID', { index, jugador }, 'WARN');
    return false;
  }
  
  logFiltro('JUGADOR_VALIDO', { index, jugadorId: jugador._id });
  return true;
};

export const FiltrosJugadores = ({ jugadores, setFiltrados }) => {
  const [equipoId, setEquipoId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);

  // 🔥 LOGGING DE PROPS AL INICIALIZAR
  useEffect(() => {
    logFiltro('COMPONENTE_INICIALIZADO', {
      jugadoresLength: jugadores?.length || 0,
      jugadoresTipo: typeof jugadores,
      esArray: Array.isArray(jugadores),
      setFiltradosTipo: typeof setFiltrados
    });
    
    // Validar props críticas
    if (!setFiltrados || typeof setFiltrados !== 'function') {
      logFiltro('SET_FILTRADOS_INVALIDO', { setFiltrados }, 'ERROR');
    }
    
    if (jugadores && !Array.isArray(jugadores)) {
      logFiltro('JUGADORES_NO_ES_ARRAY', { jugadores, tipo: typeof jugadores }, 'ERROR');
    }
  }, []);

  // 🔥 CARGAR EQUIPOS CON VALIDACIÓN
  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        logFiltro('CARGANDO_EQUIPOS_INICIO', {});
        
        const response = await axiosInstance.get('/equipos');
        
        logFiltro('EQUIPOS_RESPONSE', { 
          status: response.status,
          totalEquipos: response.data?.length || 0
        });
        
        if (!Array.isArray(response.data)) {
          logFiltro('EQUIPOS_RESPONSE_NO_ARRAY', { 
            responseData: response.data 
          }, 'ERROR');
          setEquiposDisponibles([]);
          return;
        }
        
        // Validar cada equipo
        const equiposValidos = response.data.filter((equipo, index) => {
          if (!equipo) {
            logFiltro('EQUIPO_NULL_SKIPPED', { index }, 'WARN');
            return false;
          }
          
          if (!equipo._id) {
            logFiltro('EQUIPO_SIN_ID_SKIPPED', { index, equipo }, 'WARN');
            return false;
          }
          
          if (!equipo.categoria) {
            logFiltro('EQUIPO_SIN_CATEGORIA_SKIPPED', { 
              index, 
              equipoId: equipo._id,
              equipo 
            }, 'WARN');
            return false;
          }
          
          return true;
        });
        
        logFiltro('EQUIPOS_CARGADOS', { 
          total: response.data.length,
          validos: equiposValidos.length,
          descartados: response.data.length - equiposValidos.length
        });
        
        setEquiposDisponibles(equiposValidos);
        
      } catch (error) {
        logFiltro('ERROR_CARGAR_EQUIPOS', { 
          error: error.message,
          stack: error.stack
        }, 'ERROR');
        console.error('Error al cargar equipos:', error);
        setEquiposDisponibles([]);
      }
    };

    cargarEquipos();
  }, []);

  // 🔥 FILTRADO DEFENSIVO
  useEffect(() => {
    logFiltro('FILTRADO_INICIO', {
      totalJugadores: jugadores?.length || 0,
      equipoId,
      categoria
    });
    
    try {
      // Validar entrada
      if (!Array.isArray(jugadores)) {
        logFiltro('JUGADORES_NO_ARRAY', { 
          jugadores, 
          tipo: typeof jugadores 
        }, 'ERROR');
        setFiltrados([]);
        return;
      }
      
      let filtrados = [...jugadores];
      
      logFiltro('JUGADORES_INICIALES', { total: filtrados.length });
      
      // Aplicar filtro por equipo
      if (equipoId) {
        logFiltro('APLICANDO_FILTRO_EQUIPO', { equipoId });
        
        const filtradosPorEquipo = filtrados.filter((jugador, index) => {
          try {
            // Validar jugador
            if (!validarJugador(jugador, index)) {
              return false;
            }
            
            // Verificar si el jugador está en el equipo seleccionado
            const estaEnEquipo = jugador.equipos?.some(equipoRelacion => {
              try {
                if (!equipoRelacion) {
                  logFiltro('EQUIPO_RELACION_NULL_EN_FILTRO', { 
                    jugadorId: jugador._id 
                  }, 'WARN');
                  return false;
                }
                
                if (!equipoRelacion.equipo) {
                  logFiltro('EQUIPO_NULL_EN_RELACION_FILTRO', { 
                    jugadorId: jugador._id,
                    equipoRelacion 
                  }, 'WARN');
                  return false;
                }
                
                // Comparar ID del equipo
                const equipoEnRelacionId = typeof equipoRelacion.equipo === 'object' 
                  ? equipoRelacion.equipo._id 
                  : equipoRelacion.equipo;
                
                const coincide = equipoEnRelacionId === equipoId;
                
                logFiltro('COMPARACION_EQUIPO', {
                  jugadorId: jugador._id,
                  equipoEnRelacionId,
                  equipoIdBuscado: equipoId,
                  coincide
                });
                
                return coincide;
                
              } catch (error) {
                logFiltro('ERROR_EN_SOME_EQUIPO', {
                  jugadorId: jugador._id,
                  equipoRelacion,
                  error: error.message
                }, 'ERROR');
                return false;
              }
            });
            
            logFiltro('JUGADOR_FILTRO_EQUIPO', {
              jugadorId: jugador._id,
              estaEnEquipo,
              equiposBuscado: equipoId
            });
            
            return estaEnEquipo;
            
          } catch (error) {
            logFiltro('ERROR_FILTRAR_POR_EQUIPO', {
              index,
              jugadorId: jugador?._id,
              error: error.message
            }, 'ERROR');
            return false;
          }
        });
        
        filtrados = filtradosPorEquipo;
        
        logFiltro('FILTRO_EQUIPO_APLICADO', {
          equipoId,
          resultados: filtrados.length
        });
      }

      // Aplicar filtro por categoría
      if (categoria) {
        logFiltro('APLICANDO_FILTRO_CATEGORIA', { categoria });
        
        const filtradosPorCategoria = filtrados.filter((jugador, index) => {
          try {
            // Validar jugador
            if (!validarJugador(jugador, index)) {
              return false;
            }
            
            // Obtener categorías del jugador
            const categoriasJugador = getCategoriasUsuario(jugador);
            
            const tieneCategoria = categoriasJugador.includes(categoria);
            
            logFiltro('JUGADOR_FILTRO_CATEGORIA', {
              jugadorId: jugador._id,
              categoriasJugador,
              categoriaBuscada: categoria,
              tieneCategoria
            });
            
            return tieneCategoria;
            
          } catch (error) {
            logFiltro('ERROR_FILTRAR_POR_CATEGORIA', {
              index,
              jugadorId: jugador?._id,
              categoria,
              error: error.message
            }, 'ERROR');
            return false;
          }
        });
        
        filtrados = filtradosPorCategoria;
        
        logFiltro('FILTRO_CATEGORIA_APLICADO', {
          categoria,
          resultados: filtrados.length
        });
      }

      // Establecer resultados filtrados
      setFiltrados(filtrados);
      
      logFiltro('FILTRADO_COMPLETADO', {
        jugadoresOriginales: jugadores.length,
        jugadoresFiltrados: filtrados.length,
        filtros: { equipoId, categoria }
      });
      
    } catch (error) {
      logFiltro('ERROR_GENERAL_FILTRADO', {
        error: error.message,
        stack: error.stack,
        jugadores: jugadores?.length,
        filtros: { equipoId, categoria }
      }, 'ERROR');
      
      console.error('Error en filtrado:', error);
      setFiltrados([]);
    }
  }, [equipoId, categoria, jugadores, setFiltrados]);

  // 🔥 FILTRAR EQUIPOS DISPONIBLES DE FORMA SEGURA
  const equiposFiltrados = useMemo(() => {
    logFiltro('FILTRANDO_EQUIPOS_DISPONIBLES', { 
      categoria, 
      totalEquipos: equiposDisponibles.length 
    });
    
    try {
      if (!categoria) {
        logFiltro('SIN_CATEGORIA_SELECCIONADA', { equiposDisponibles: equiposDisponibles.length });
        return equiposDisponibles;
      }
      
      if (!Array.isArray(equiposDisponibles)) {
        logFiltro('EQUIPOS_DISPONIBLES_NO_ARRAY', { 
          equiposDisponibles, 
          tipo: typeof equiposDisponibles 
        }, 'ERROR');
        return [];
      }
      
      const resultado = equiposDisponibles.filter((equipo, index) => {
        try {
          if (!equipo) {
            logFiltro('EQUIPO_NULL_EN_FILTRADO', { index }, 'WARN');
            return false;
          }
          
          if (typeof equipo !== 'object') {
            logFiltro('EQUIPO_NO_OBJECT_EN_FILTRADO', { 
              index, 
              equipo, 
              tipo: typeof equipo 
            }, 'WARN');
            return false;
          }
          
          if (!equipo._id) {
            logFiltro('EQUIPO_SIN_ID_EN_FILTRADO', { 
              index, 
              equipo 
            }, 'WARN');
            return false;
          }
          
          if (!equipo.categoria) {
            logFiltro('EQUIPO_SIN_CATEGORIA_EN_FILTRADO', { 
              index,
              equipoId: equipo._id,
              equipo
            }, 'WARN');
            return false;
          }
          
          const coincide = equipo.categoria === categoria;
          logFiltro('EQUIPO_EVALUADO_CATEGORIA', {
            equipoId: equipo._id,
            equipoCategoria: equipo.categoria,
            categoriaBuscada: categoria,
            coincide
          });
          
          return coincide;
          
        } catch (error) {
          logFiltro('ERROR_FILTRAR_EQUIPO_INDIVIDUAL', {
            index,
            equipo,
            error: error.message
          }, 'ERROR');
          return false;
        }
      });
      
      logFiltro('EQUIPOS_FILTRADOS_POR_CATEGORIA', {
        categoria,
        equiposOriginales: equiposDisponibles.length,
        equiposFiltrados: resultado.length
      });
      
      return resultado;
      
    } catch (error) {
      logFiltro('ERROR_GENERAL_FILTRAR_EQUIPOS', {
        categoria,
        equiposDisponibles: equiposDisponibles?.length,
        error: error.message,
        stack: error.stack
      }, 'ERROR');
      return [];
    }
  }, [categoria, equiposDisponibles]);

  // 🔥 LOGGING DE CAMBIOS DE ESTADO
  useEffect(() => {
    logFiltro('ESTADO_CAMBIO', {
      equipoId,
      categoria,
      equiposDisponibles: equiposDisponibles.length,
      equiposFiltrados: equiposFiltrados.length
    });
  }, [equipoId, categoria, equiposDisponibles.length, equiposFiltrados.length]);

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Categoría</InputLabel>
        <Select
          value={categoria}
          label="Categoría"
          onChange={e => {
            const nuevaCategoria = e.target.value;
            logFiltro('CATEGORIA_CAMBIADA', { 
              anterior: categoria, 
              nueva: nuevaCategoria 
            });
            try {
              setCategoria(nuevaCategoria);
              setEquipoId(''); // Limpiar equipo cuando cambia categoría
              logFiltro('CATEGORIA_ESTABLECIDA', { categoria: nuevaCategoria });
            } catch (error) {
              logFiltro('ERROR_CAMBIAR_CATEGORIA', {
                nuevaCategoria,
                error: error.message
              }, 'ERROR');
            }
          }}
        >
          <MenuItem value="">Todas</MenuItem>
          {categorias.map((c, index) => {
            try {
              if (!c || !c.value || !c.label) {
                logFiltro('CATEGORIA_OPTION_INVALIDA', { index, categoria: c }, 'WARN');
                return null;
              }
              
              return (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              );
            } catch (error) {
              logFiltro('ERROR_RENDER_CATEGORIA_OPTION', {
                index,
                categoria: c,
                error: error.message
              }, 'ERROR');
              return null;
            }
          })}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ minWidth: 200 }}
        disabled={categoria && equiposFiltrados.length === 0}
      >
        <InputLabel>Equipo</InputLabel>
        <Select
          value={equipoId}
          label="Equipo"
          onChange={e => {
            const nuevoEquipo = e.target.value;
            logFiltro('EQUIPO_CAMBIADO', { 
              anterior: equipoId, 
              nuevo: nuevoEquipo 
            });
            try {
              setEquipoId(nuevoEquipo);
              logFiltro('EQUIPO_ESTABLECIDO', { equipoId: nuevoEquipo });
            } catch (error) {
              logFiltro('ERROR_CAMBIAR_EQUIPO', {
                nuevoEquipo,
                error: error.message
              }, 'ERROR');
            }
          }}
        >
          <MenuItem value="">Todos</MenuItem>
          {equiposFiltrados.map((e, index) => {
            try {
              // Validación extra en el render
              if (!e) {
                logFiltro('EQUIPO_NULL_EN_RENDER', { index }, 'WARN');
                return null;
              }
              
              if (typeof e !== 'object') {
                logFiltro('EQUIPO_NO_OBJECT_EN_RENDER', { 
                  index, 
                  equipo: e, 
                  tipo: typeof e 
                }, 'WARN');
                return null;
              }
              
              if (!e._id) {
                logFiltro('EQUIPO_SIN_ID_EN_RENDER', { index, equipo: e }, 'WARN');
                return null;
              }
              
              if (!e.nombre) {
                logFiltro('EQUIPO_SIN_NOMBRE_EN_RENDER', { 
                  index, 
                  equipoId: e._id, 
                  equipo: e 
                }, 'WARN');
                return null;
              }
              
              // Obtener nombre de categoría de forma segura
              let nombreCategoria;
              try {
                nombreCategoria = getCategoryName(e.categoria) || 'Sin categoría';
              } catch (error) {
                logFiltro('ERROR_GET_CATEGORY_NAME', {
                  equipoId: e._id,
                  categoria: e.categoria,
                  error: error.message
                }, 'WARN');
                nombreCategoria = e.categoria || 'Sin categoría';
              }
              
              const displayText = `${e.nombre} (${nombreCategoria})`;
              
              logFiltro('EQUIPO_RENDERIZADO', {
                equipoId: e._id,
                nombre: e.nombre,
                categoria: e.categoria,
                displayText
              });
              
              return (
                <MenuItem key={e._id} value={e._id}>
                  {displayText}
                </MenuItem>
              );
              
            } catch (error) {
              logFiltro('ERROR_RENDER_EQUIPO_OPTION', {
                index,
                equipo: e,
                error: error.message,
                stack: error.stack
              }, 'ERROR');
              return null;
            }
          })}
        </Select>
      </FormControl>
    </Box>
  );
};