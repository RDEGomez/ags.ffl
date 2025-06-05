// 📁 client/src/pages/partidos/importacion/TipoImportacion.jsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  SportsFootball as SportsFootballIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export const TipoImportacion = ({ wizardData, updateWizardData, onNext }) => {
  const [selectedType, setSelectedType] = useState(wizardData.tipo || '');

  const handleSelect = (tipo) => {
    setSelectedType(tipo);
    updateWizardData({ tipo });
  };

  const handleContinue = () => {
    if (selectedType) {
      onNext();
    }
  };

  // 🎯 Configuración de tipos de importación
  const tiposImportacion = [
    {
      id: 'partidos',
      titulo: 'Importar Partidos',
      descripcion: 'Carga masiva de partidos desde CSV/Excel',
      icono: <SportsFootballIcon sx={{ fontSize: 80, color: '#64b5f6' }} />,
      color: '#64b5f6',
      bgColor: 'rgba(100, 181, 246, 0.1)',
      borderColor: 'rgba(100, 181, 246, 0.3)',
      recomendado: true,
      etiqueta: 'Recomendado para inicializar',
      caracteristicas: [
        'Equipos enfrentados',
        'Fechas y horarios',
        'Torneos y categorías',
        'Sedes y árbitros',
        'Estados y marcadores'
      ],
      useCases: [
        'Migrar temporada completa',
        'Cargar calendario desde Excel',
        'Importar resultados históricos',
        'Backup y restauración'
      ]
    },
    {
      id: 'jugadas',
      titulo: 'Importar Jugadas',
      descripcion: 'Cargar estadísticas detalladas de partidos',
      icono: <TimelineIcon sx={{ fontSize: 80, color: '#4caf50' }} />,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)',
      recomendado: false,
      etiqueta: 'Para datos históricos',
      caracteristicas: [
        'Jugadas play-by-play',
        'Estadísticas de jugadores',
        'Touchdowns y conversiones',
        'Defensivas y sacks',
        'Timeline completo'
      ],
      useCases: [
        'Migrar estadísticas detalladas',
        'Cargar análisis históricos',
        'Importar desde otras apps',
        'Datos de scouting'
      ]
    }
  ];

  // 🎨 Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 } 
    }
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          textAlign: 'center',
          mb: 3,
          fontSize: '1.1rem'
        }}>
          Selecciona qué tipo de datos vas a importar. Cada tipo tiene su propio formato y validaciones específicas.
        </Typography>

        {/* Tarjetas de selección */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {tiposImportacion.map((tipo) => (
            <Grid item xs={12} md={6} key={tipo.id}>
              <motion.div variants={cardVariants}>
                <Card
                  onClick={() => handleSelect(tipo.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedType === tipo.id 
                      ? tipo.bgColor 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: selectedType === tipo.id 
                      ? `2px solid ${tipo.color}` 
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    transform: selectedType === tipo.id ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: selectedType === tipo.id 
                      ? `0 8px 32px ${tipo.color}40` 
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      backgroundColor: tipo.bgColor,
                      border: `2px solid ${tipo.color}`,
                      boxShadow: `0 12px 40px ${tipo.color}30`
                    },
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    p: 4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Icono y título */}
                    <Box sx={{ mb: 3 }}>
                      {tipo.icono}
                      
                      <Typography variant="h5" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        mt: 2,
                        mb: 1
                      }}>
                        {tipo.titulo}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 2
                      }}>
                        {tipo.descripcion}
                      </Typography>

                      {/* Etiqueta */}
                      <Chip
                        label={tipo.etiqueta}
                        color={tipo.recomendado ? 'primary' : 'success'}
                        size="small"
                        variant={selectedType === tipo.id ? 'filled' : 'outlined'}
                        sx={{ 
                          fontWeight: 'bold',
                          ...(selectedType === tipo.id && {
                            backgroundColor: tipo.color,
                            color: 'white'
                          })
                        }}
                      />
                    </Box>

                    {/* Características */}
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ 
                          color: tipo.color, 
                          fontWeight: 'bold',
                          mb: 1
                        }}>
                          Incluye:
                        </Typography>
                        
                        <List dense sx={{ py: 0 }}>
                          {tipo.caracteristicas.map((caracteristica, index) => (
                            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircleIcon sx={{ 
                                  fontSize: 16, 
                                  color: tipo.color 
                                }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={caracteristica}
                                primaryTypographyProps={{
                                  variant: 'caption',
                                  sx: { color: 'rgba(255, 255, 255, 0.8)' }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      {/* Casos de uso */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          fontWeight: 'bold',
                          mb: 1
                        }}>
                          Ideal para:
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 0.5,
                          justifyContent: 'center'
                        }}>
                          {tipo.useCases.map((useCase, index) => (
                            <Chip
                              key={index}
                              label={useCase}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                color: 'rgba(255, 255, 255, 0.6)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                  color: tipo.color,
                                  borderColor: tipo.color
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    {/* Indicador de selección */}
                    {selectedType === tipo.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          mt: 2 
                        }}>
                          <CheckCircleIcon sx={{ 
                            color: tipo.color, 
                            fontSize: 32
                          }} />
                        </Box>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Información adicional según selección */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              p: 3
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
                  Información Importante
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {selectedType === 'partidos' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(100, 181, 246, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <GroupIcon sx={{ color: '#64b5f6' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Equipos
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Deben existir previamente en el sistema
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <ScheduleIcon sx={{ color: '#4caf50' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Fechas
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Formato: YYYY-MM-DD HH:MM
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <SpeedIcon sx={{ color: '#ff9800' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Validación
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Automática de equipos y torneos
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </>
                )}

                {selectedType === 'jugadas' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <SportsFootballIcon sx={{ color: '#4caf50' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Partidos
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Deben existir con ID válido
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <GroupIcon sx={{ color: '#2196f3' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Jugadores
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Deben pertenecer al equipo
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                        borderRadius: 2,
                        p: 2
                      }}>
                        <AssessmentIcon sx={{ color: '#9c27b0' }} />
                        <Box>
                          <Typography variant="body2" sx={{ 
                            color: 'white', 
                            fontWeight: 'bold' 
                          }}>
                            Estadísticas
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            Se calculan automáticamente
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </motion.div>
        )}

        {/* Botón de continuar */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mt: 4 
            }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                sx={{
                  background: `linear-gradient(45deg, ${tiposImportacion.find(t => t.id === selectedType)?.color} 30%, ${tiposImportacion.find(t => t.id === selectedType)?.color}90 90%)`,
                  boxShadow: `0 3px 5px 2px ${tiposImportacion.find(t => t.id === selectedType)?.color}30`,
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                Continuar con {tiposImportacion.find(t => t.id === selectedType)?.titulo}
              </Button>
            </Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};