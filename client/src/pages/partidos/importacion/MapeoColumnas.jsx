// 📁 client/src/pages/partidos/importacion/MapeoColumnas.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Autocomplete,
  TextField,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Preview as PreviewIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export const MapeoColumnas = ({ wizardData, updateWizardData, setLoading, setError, onNext }) => {
  const [mappings, setMappings] = useState(wizardData.mappings || {});
  const [previewData, setPreviewData] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});

  // 🎯 Campos esperados según el tipo de importación
  const camposEsperados = {
    partidos: [
      { 
        key: 'equipo_local', 
        label: 'Equipo Local', 
        required: true, 
        description: 'Nombre del equipo que juega como local',
        ejemplo: 'Tigres, Leones FC, Águilas'
      },
      { 
        key: 'equipo_visitante', 
        label: 'Equipo Visitante', 
        required: true, 
        description: 'Nombre del equipo que juega como visitante',
        ejemplo: 'Pumas, Real Madrid, Barcelona'
      },
      { 
        key: 'torneo', 
        label: 'Torneo', 
        required: true, 
        description: 'Nombre del torneo al que pertenece el partido',
        ejemplo: 'Copa Primavera, Liga Regular, Playoffs'
      },
      { 
        key: 'fecha_hora', 
        label: 'Fecha y Hora', 
        required: true, 
        description: 'Fecha y hora del partido',
        ejemplo: '2024-03-15 16:00, 2024-12-25 14:30'
      },
      { 
        key: 'categoria', 
        label: 'Categoría', 
        required: false, 
        description: 'Categoría del partido (se detecta automáticamente si no se especifica)',
        ejemplo: 'mixgold, varsilv, femgold'
      },
      { 
        key: 'sede_nombre', 
        label: 'Nombre de Sede', 
        required: false, 
        description: 'Nombre del lugar donde se juega',
        ejemplo: 'Campo Central, Estadio Municipal'
      },
      { 
        key: 'sede_direccion', 
        label: 'Dirección de Sede', 
        required: false, 
        description: 'Dirección completa de la sede',
        ejemplo: 'Av. Principal 123, Col. Centro'
      },
      { 
        key: 'arbitro_principal', 
        label: 'Árbitro Principal', 
        required: false, 
        description: 'Nombre del árbitro principal',
        ejemplo: 'Juan Pérez, María López'
      },
      { 
        key: 'estado', 
        label: 'Estado del Partido', 
        required: false, 
        description: 'Estado actual del partido',
        ejemplo: 'programado, finalizado, en_curso'
      },
      { 
        key: 'marcador_local', 
        label: 'Marcador Local', 
        required: false, 
        description: 'Puntos del equipo local',
        ejemplo: '21, 14, 0'
      },
      { 
        key: 'marcador_visitante', 
        label: 'Marcador Visitante', 
        required: false, 
        description: 'Puntos del equipo visitante',
        ejemplo: '14, 7, 21'
      },
      { 
        key: 'observaciones', 
        label: 'Observaciones', 
        required: false, 
        description: 'Comentarios adicionales sobre el partido',
        ejemplo: 'Partido suspendido por lluvia, Final emocionante'
      },
      { 
        key: 'duracion_minutos', 
        label: 'Duración (minutos)', 
        required: false, 
        description: 'Duración del partido en minutos',
        ejemplo: '50, 60, 40'
      }
    ],
    jugadas: [
      { 
        key: 'partido_id', 
        label: 'ID del Partido', 
        required: true, 
        description: 'ID único del partido (ObjectId)',
        ejemplo: '64f7b123abc456def789'
      },
      { 
        key: 'tipo_jugada', 
        label: 'Tipo de Jugada', 
        required: true, 
        description: 'Tipo específico de la jugada',
        ejemplo: 'pase_completo, touchdown, intercepcion'
      },
      { 
        key: 'equipo_posesion', 
        label: 'Equipo en Posesión', 
        required: true, 
        description: 'Nombre del equipo que tiene la posesión',
        ejemplo: 'Tigres, Leones'
      },
      { 
        key: 'jugador_principal', 
        label: 'Jugador Principal', 
        required: true, 
        description: 'Nombre del jugador que ejecuta la jugada',
        ejemplo: 'Juan García, Pedro López'
      },
      { 
        key: 'minuto', 
        label: 'Minuto', 
        required: false, 
        description: 'Minuto en que ocurre la jugada',
        ejemplo: '5, 12, 25'
      },
      { 
        key: 'segundo', 
        label: 'Segundo', 
        required: false, 
        description: 'Segundo específico de la jugada',
        ejemplo: '30, 45, 15'
      },
      { 
        key: 'periodo', 
        label: 'Período', 
        required: false, 
        description: 'Período del partido (1 o 2)',
        ejemplo: '1, 2'
      },
      { 
        key: 'jugador_secundario', 
        label: 'Jugador Secundario', 
        required: false, 
        description: 'Jugador receptor o involucrado secundariamente',
        ejemplo: 'Carlos Ruiz, Ana Martínez'
      },
      { 
        key: 'descripcion', 
        label: 'Descripción', 
        required: false, 
        description: 'Descripción detallada de la jugada',
        ejemplo: 'Pase de 15 yardas, Corrida para TD'
      },
      { 
        key: 'puntos', 
        label: 'Puntos', 
        required: false, 
        description: 'Puntos obtenidos en la jugada',
        ejemplo: '6, 1, 2, 0'
      },
      { 
        key: 'touchdown', 
        label: 'Es Touchdown', 
        required: false, 
        description: 'Indica si la jugada es un touchdown',
        ejemplo: 'true, false, 1, 0'
      },
      { 
        key: 'intercepcion', 
        label: 'Es Intercepción', 
        required: false, 
        description: 'Indica si la jugada es una intercepción',
        ejemplo: 'true, false, 1, 0'
      },
      { 
        key: 'sack', 
        label: 'Es Sack', 
        required: false, 
        description: 'Indica si la jugada es un sack',
        ejemplo: 'true, false, 1, 0'
      }
    ]
  };

  const campos = camposEsperados[wizardData.tipo] || camposEsperados.partidos;
  const headers = wizardData.headers || [];

  // 🔄 Mapeo automático inteligente
  const autoMapear = () => {
    const newMappings = {};
    
    campos.forEach(campo => {
      // Buscar coincidencia exacta
      let match = headers.find(header => 
        header.toLowerCase() === campo.key.toLowerCase()
      );
      
      // Si no hay coincidencia exacta, buscar coincidencia parcial
      if (!match) {
        match = headers.find(header => {
          const headerNormalizado = header.toLowerCase().replace(/[_\s-]/g, '');
          const campoNormalizado = campo.key.toLowerCase().replace(/[_\s-]/g, '');
          return headerNormalizado.includes(campoNormalizado) || 
                 campoNormalizado.includes(headerNormalizado);
        });
      }
      
      // Mapeos específicos comunes
      if (!match) {
        const mapeosFrecuentes = {
          equipo_local: ['local', 'home', 'casa', 'equipo1'],
          equipo_visitante: ['visitante', 'away', 'visita', 'equipo2'],
          fecha_hora: ['fecha', 'date', 'datetime', 'when', 'hora'],
          marcador_local: ['goles_local', 'puntos_casa', 'score_home'],
          marcador_visitante: ['goles_visitante', 'puntos_visita', 'score_away'],
          tipo_jugada: ['play_type', 'jugada', 'action'],
          jugador_principal: ['player', 'jugador', 'quien'],
          partido_id: ['game_id', 'match_id', 'id_partido']
        };
        
        const alternativas = mapeosFrecuentes[campo.key] || [];
        match = headers.find(header => 
          alternativas.some(alt => 
            header.toLowerCase().includes(alt.toLowerCase())
          )
        );
      }
      
      if (match) {
        newMappings[campo.key] = match;
      }
    });
    
    setMappings(newMappings);
    updateWizardData({ mappings: newMappings });
    validarMapeo(newMappings);
  };

  // ✅ Validar mapeo actual
  const validarMapeo = (currentMappings = mappings) => {
    const status = {};
    let allValid = true;
    
    campos.forEach(campo => {
      const mapped = currentMappings[campo.key];
      
      if (campo.required && !mapped) {
        status[campo.key] = { 
          type: 'error', 
          message: 'Campo requerido sin mapear' 
        };
        allValid = false;
      } else if (mapped && !headers.includes(mapped)) {
        status[campo.key] = { 
          type: 'error', 
          message: 'Columna no existe en CSV' 
        };
        allValid = false;
      } else if (mapped) {
        status[campo.key] = { 
          type: 'success', 
          message: 'Mapeado correctamente' 
        };
      } else {
        status[campo.key] = { 
          type: 'info', 
          message: 'Campo opcional no mapeado' 
        };
      }
    });
    
    setValidationStatus(status);
    return allValid;
  };

  // 🔄 Actualizar mapeo individual
  const updateMapping = (campo, valor) => {
    const newMappings = {
      ...mappings,
      [campo]: valor
    };
    
    setMappings(newMappings);
    updateWizardData({ mappings: newMappings });
    validarMapeo(newMappings);
  };

  // 👀 Generar preview con mapeo
  const generarPreview = () => {
    if (!wizardData.csvData || Object.keys(mappings).length === 0) return;
    
    setLoading(true);
    
    try {
      const preview = wizardData.csvData.slice(0, 3).map((row, index) => {
        const mappedRow = {};
        Object.entries(mappings).forEach(([campo, header]) => {
          mappedRow[campo] = row[header];
        });
        return { ...mappedRow, _originalIndex: index };
      });
      
      setPreviewData(preview);
    } catch (error) {
      setError('Error al generar preview: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Continuar al siguiente paso
  const handleContinue = () => {
    if (validarMapeo()) {
      generarPreview();
      setTimeout(() => {
        onNext();
      }, 1000);
    } else {
      setError('Por favor completa el mapeo de todos los campos requeridos antes de continuar');
    }
  };

  // 📊 Calcular progreso
  const getProgreso = () => {
    const totalRequeridos = campos.filter(c => c.required).length;
    const mapeadosRequeridos = campos.filter(c => 
      c.required && mappings[c.key]
    ).length;
    return Math.round((mapeadosRequeridos / totalRequeridos) * 100);
  };

  // ⚡ Auto-mapeo inicial
  useEffect(() => {
    if (headers.length > 0 && Object.keys(mappings).length === 0) {
      autoMapear();
    }
  }, [headers]);

  // 🔄 Validar cuando cambie el mapeo
  useEffect(() => {
    validarMapeo();
  }, [mappings]);

  return (
    <Box>
      {/* Header con progreso */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Mapear Columnas CSV a Campos del Sistema
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={autoMapear}
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: 'rgba(100, 181, 246, 0.3)',
                color: '#64b5f6',
                '&:hover': {
                  borderColor: 'rgba(100, 181, 246, 0.5)',
                  backgroundColor: 'rgba(100, 181, 246, 0.05)'
                }
              }}
            >
              Auto-mapear
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={generarPreview}
              startIcon={<PreviewIcon />}
              disabled={Object.keys(mappings).length === 0}
              sx={{
                borderColor: 'rgba(76, 175, 80, 0.3)',
                color: '#4caf50',
                '&:hover': {
                  borderColor: 'rgba(76, 175, 80, 0.5)',
                  backgroundColor: 'rgba(76, 175, 80, 0.05)'
                }
              }}
            >
              Preview
            </Button>
          </Box>
        </Box>

        {/* Barra de progreso */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Progreso del mapeo
            </Typography>
            <Typography variant="body2" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
              {getProgreso()}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgreso()}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: getProgreso() === 100 ? '#4caf50' : '#64b5f6'
              }
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'center'
        }}>
          Asocia cada columna de tu CSV con los campos correspondientes del sistema. 
          Los campos marcados con <span style={{color: '#f44336'}}>*</span> son obligatorios.
        </Typography>
      </Box>

      {/* Mapeo de campos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {campos.map(campo => (
          <Grid item xs={12} md={6} key={campo.key}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: campos.indexOf(campo) * 0.1 }}
            >
              <Paper sx={{ 
                p: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  validationStatus[campo.key]?.type === 'error' ? '#f44336' :
                  validationStatus[campo.key]?.type === 'success' ? '#4caf50' :
                  'rgba(255, 255, 255, 0.1)'
                }`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2 
                }}>
                  <LinkIcon sx={{ 
                    color: validationStatus[campo.key]?.type === 'success' ? '#4caf50' : '#64b5f6',
                    fontSize: 20 
                  }} />
                  <Typography variant="subtitle2" sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    flex: 1
                  }}>
                    {campo.label}
                    {campo.required && (
                      <span style={{ color: '#f44336', marginLeft: 4 }}>*</span>
                    )}
                  </Typography>
                  
                  {/* Icono de estado */}
                  {validationStatus[campo.key] && (
                    <Tooltip title={validationStatus[campo.key].message}>
                      {validationStatus[campo.key].type === 'success' ? (
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                      ) : validationStatus[campo.key].type === 'error' ? (
                        <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                      ) : (
                        <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                      )}
                    </Tooltip>
                  )}
                </Box>

                <Autocomplete
                  value={headers.find(h => h === mappings[campo.key]) || null}
                  onChange={(event, newValue) => updateMapping(campo.key, newValue || '')}
                  options={headers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Seleccionar columna CSV"
                      size="small"
                      error={validationStatus[campo.key]?.type === 'error'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#64b5f6',
                          },
                          '&.Mui-error fieldset': {
                            borderColor: '#f44336',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box 
                        component="li" 
                        key={key}
                        {...otherProps}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          py: 1 
                        }}
                      >
                        <Chip 
                          label="CSV" 
                          size="small" 
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Typography variant="body2">
                          {option}
                        </Typography>
                      </Box>
                    );
                  }}
                  noOptionsText="No hay columnas disponibles"
                />

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: 'block',
                    mb: 0.5
                  }}>
                    {campo.description}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(100, 181, 246, 0.8)',
                    fontStyle: 'italic'
                  }}>
                    Ejemplo: {campo.ejemplo}
                  </Typography>
                </Box>

                {/* Preview del valor mapeado */}
                {mappings[campo.key] && wizardData.csvData && wizardData.csvData[0] && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 1.5,
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(100, 181, 246, 0.2)'
                  }}>
                    <Typography variant="caption" sx={{ 
                      color: '#64b5f6', 
                      fontWeight: 'bold',
                      display: 'block',
                      mb: 0.5
                    }}>
                      Valor de ejemplo:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'white',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      p: 0.5,
                      borderRadius: 0.5,
                      fontSize: '0.8rem'
                    }}>
                      {wizardData.csvData[0][mappings[campo.key]] || '—'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Preview de datos mapeados */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Paper sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              p: 3,
              mb: 4
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <PreviewIcon sx={{ color: '#64b5f6' }} />
                <Typography variant="h6" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold' 
                }}>
                  Preview de Datos Mapeados
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(mappings).map(campo => (
                        <TableCell 
                          key={campo}
                          sx={{ 
                            backgroundColor: 'rgba(100, 181, 246, 0.1)',
                            color: '#64b5f6',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        >
                          {campos.find(c => c.key === campo)?.label || campo}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(mappings).map(campo => (
                          <TableCell 
                            key={campo}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.8)',
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {row[campo] !== null && row[campo] !== undefined 
                              ? String(row[campo]) 
                              : '—'
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Información de ayuda */}
      <Paper sx={{
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        border: '1px solid rgba(33, 150, 243, 0.2)',
        borderRadius: 2,
        p: 3,
        mb: 4
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2 
        }}>
          <InfoIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ 
            color: 'white', 
            fontWeight: 'bold' 
          }}>
            Consejos para el Mapeo
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              <strong style={{color: '#64b5f6'}}>Auto-mapeo:</strong> El sistema intenta mapear automáticamente las columnas que coinciden con los nombres esperados.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              <strong style={{color: '#4caf50'}}>Preview:</strong> Usa el botón "Preview" para ver cómo se verán tus datos una vez mapeados.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              <strong style={{color: '#ff9800'}}>Validación:</strong> Los campos opcionales pueden quedar sin mapear si no los tienes en tu CSV.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Botón de continuar */}
      {getProgreso() === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              startIcon={<CheckCircleIcon />}
              sx={{
                background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              Mapeo Completo - Continuar
            </Button>
          </Box>
        </motion.div>
      )}
    </Box>
  );
};