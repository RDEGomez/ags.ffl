// 📁 client/src/pages/partidos/importacion/ProcesoImportacion.jsx - MODIFICADO PARA NÚMEROS
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as FileDownloadIcon,
  Share as ShareIcon,
  Home as HomeIcon,
  Tag as TagIcon // 🔥 NUEVO: Icono para números
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const ProcesoImportacion = ({ wizardData, updateWizardData, setLoading, setError }) => {
  const navigate = useNavigate();
  
  const [importacionStatus, setImportacionStatus] = useState('idle'); // 'idle' | 'processing' | 'completed' | 'error'
  const [progreso, setProgreso] = useState(0);
  const [etapaActual, setEtapaActual] = useState('');
  const [resultados, setResultados] = useState(null);
  const [tiempoInicio, setTiempoInicio] = useState(null);
  const [tiempoFin, setTiempoFin] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    exitosos: true,
    errores: true,
    warnings: false,
    resumen: true
  });

  // 🚀 Iniciar proceso de importación automáticamente
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (
      wizardData.validationResults?.puedeImportar && 
      !hasExecutedRef.current &&
      importacionStatus === 'idle'
    ) {
      hasExecutedRef.current = true;
      iniciarImportacion();
    }
  }, [wizardData.validationResults?.puedeImportar, importacionStatus]);

  // 🔥 Función principal de importación
  const iniciarImportacion = async () => {
    try {
      setImportacionStatus('processing');
      setTiempoInicio(new Date());
      setLoading(true);

      console.log('🚀 Iniciando importación masiva...');
      console.log('📋 Tipo de importación:', wizardData.tipo);

      // Preparar archivo para envío
      const archivo = prepararArchivoCSV();
      
      // Configurar request
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const endpoint = wizardData.tipo === 'partidos' 
        ? `${baseURL}/api/importacion/partidos`
        : `${baseURL}/api/importacion/jugadas`;

      const formData = new FormData();
      formData.append('archivo', archivo);

      // Agregar configuraciones adicionales
      if (wizardData.configuraciones) {
        Object.entries(wizardData.configuraciones).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      // 🔥 NUEVO: Log específico para importación de jugadas con números
      if (wizardData.tipo === 'jugadas') {
        console.log('🏈 Importando jugadas con números de jugadores...');
        console.log('📊 Validaciones previas:', {
          puedeImportar: wizardData.validationResults?.puedeImportar,
          errores: wizardData.validationResults?.analisis?.validacion?.erroresEstructura?.filter(e => e.tipo === 'error').length || 0,
          warnings: wizardData.validationResults?.analisis?.validacion?.erroresEstructura?.filter(e => e.tipo === 'warning').length || 0
        });
      }

      // Simular progreso por etapas
      await simularProgresoEtapas();

      // Ejecutar importación real
      setEtapaActual('Enviando datos al servidor...');
      setProgreso(70);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      setProgreso(90);
      setEtapaActual('Procesando respuesta...');

      if (!response.ok) {
        const errorData = await response.json();
        
        // 🔥 NUEVO: Manejo específico de errores de números de jugadores
        if (errorData.mensaje && errorData.mensaje.includes('numero_jugador_principal')) {
          throw new Error('Error en números de jugadores: ' + errorData.mensaje + 
            '\n\nAsegúrate de usar números enteros positivos en lugar de nombres.');
        }
        
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const resultadosImportacion = await response.json();
      
      setProgreso(100);
      setEtapaActual('Importación completada');
      setTiempoFin(new Date());
      setResultados(resultadosImportacion.resultados);
      setImportacionStatus('completed');

      // 🔥 NUEVO: Log específico para resultados de jugadas
      if (wizardData.tipo === 'jugadas') {
        console.log('🎯 Resultados de importación de jugadas:', {
          exitosos: resultadosImportacion.resultados?.estadisticas?.creados || 0,
          errores: resultadosImportacion.resultados?.estadisticas?.errores || 0,
          warnings: resultadosImportacion.resultados?.warnings?.length || 0
        });
      }

      // Actualizar wizard data
      updateWizardData(prev => ({
        ...prev,
        importacionResults: resultadosImportacion.resultados,
        resumenImportacion: resultadosImportacion.resumen,
        validationResults: {
          ...prev.validationResults,
          puedeImportar: false // ← Esto previene el ciclo infinito
        }
      }));

      console.log('✅ Importación completada:', resultadosImportacion);

    } catch (error) {
      console.error('❌ Error en importación:', error);
      setImportacionStatus('error');
      setEtapaActual('Error en importación');
      
      // 🔥 NUEVO: Manejo mejorado de errores específicos de números
      let errorMessage = error.message;
      if (errorMessage.includes('numero_jugador_principal') || errorMessage.includes('numero_jugador_secundario')) {
        errorMessage += '\n\n💡 Sugerencias:\n' +
          '• Verifica que uses números enteros positivos (ej: 12, 25, 8)\n' +
          '• No uses nombres de jugadores en los campos numero_jugador_*\n' +
          '• Descarga la plantilla actualizada si tienes dudas';
      }
      
      setError(`Error al importar ${wizardData.tipo}: ${errorMessage}`);
      setTiempoFin(new Date());
    } finally {
      setLoading(false);
      
      // Limpiar progreso después de un tiempo
      setTimeout(() => {
        if (importacionStatus === 'completed') {
          setProgreso(0);
          setEtapaActual('');
        }
      }, 3000);
    }
  };

  // 📝 Preparar archivo CSV con mapeo aplicado
  const prepararArchivoCSV = () => {
    const { archivo } = wizardData;
    
    if (!archivo) {
      throw new Error('No hay archivo para procesar');
    }
    
    return archivo;
  };

  // ⏱️ Simular progreso por etapas
  const simularProgresoEtapas = async () => {
    const etapas = wizardData.tipo === 'jugadas' ? [
      // 🔥 MODIFICADO: Etapas específicas para jugadas con números
      { texto: 'Preparando datos de jugadas...', progreso: 10, tiempo: 800 },
      { texto: 'Validando números de jugadores...', progreso: 25, tiempo: 600 },
      { texto: 'Mapeando equipos y jugadores...', progreso: 40, tiempo: 500 },
      { texto: 'Verificando números únicos por equipo...', progreso: 55, tiempo: 400 }
    ] : [
      // Etapas para partidos (sin cambios)
      { texto: 'Preparando datos...', progreso: 10, tiempo: 800 },
      { texto: 'Validando formato...', progreso: 25, tiempo: 600 },
      { texto: 'Mapeando columnas...', progreso: 40, tiempo: 500 },
      { texto: 'Verificando equipos...', progreso: 55, tiempo: 400 }
    ];

    for (const etapa of etapas) {
      setEtapaActual(etapa.texto);
      setProgreso(etapa.progreso);
      await new Promise(resolve => setTimeout(resolve, etapa.tiempo));
    }
  };

  // 🎨 Alternar sección expandida
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 📊 Calcular tiempo transcurrido
  const calcularTiempoTranscurrido = () => {
    if (!tiempoInicio) return 0;
    const fin = tiempoFin || new Date();
    return Math.round((fin.getTime() - tiempoInicio.getTime()) / 1000);
  };

  // 🔄 Reiniciar importación
  const reiniciarImportacion = () => {
    setImportacionStatus('idle');
    setProgreso(0);
    setEtapaActual('');
    setResultados(null);
    setTiempoInicio(null);
    setTiempoFin(null);
    hasExecutedRef.current = false;
    setError('');
  };

  // 🏠 Volver al inicio
  const volverAlInicio = () => {
    navigate('/partidos');
  };

  // 🔥 NUEVA FUNCIÓN: Renderizar información específica de jugadas con números
  const renderInfoJugadas = () => {
    if (wizardData.tipo !== 'jugadas') return null;

    return (
      <Alert 
        severity="info" 
        icon={<TagIcon />}
        sx={{ 
          mb: 2, 
          backgroundColor: 'rgba(2, 136, 209, 0.1)', 
          border: '1px solid rgba(2, 136, 209, 0.3)' 
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          🏈 Importación de Jugadas con Números
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          • Los jugadores se identifican por su <strong>número de camiseta</strong> dentro del equipo
          <br />
          • Campo principal: <code>numero_jugador_principal</code> (ej: 12, 25, 8)
          <br />
          • Campo secundario: <code>numero_jugador_secundario</code> (opcional)
          <br />
          • Los números deben coincidir con los registrados en el sistema
        </Typography>
      </Alert>
    );
  };

  // 🎨 Componente de estado de progreso
  const EstadoProgreso = () => (
    <Card 
      sx={{ 
        mb: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {importacionStatus === 'processing' && (
            <CircularProgress size={24} sx={{ mr: 2, color: '#4fc3f7' }} />
          )}
          {importacionStatus === 'completed' && (
            <CheckCircleIcon sx={{ mr: 2, color: '#66bb6a' }} />
          )}
          {importacionStatus === 'error' && (
            <ErrorIcon sx={{ mr: 2, color: '#f44336' }} />
          )}
          
          <Typography variant="h6" sx={{ color: 'white' }}>
            {importacionStatus === 'idle' && 'Preparando importación...'}
            {importacionStatus === 'processing' && 'Importando datos...'}
            {importacionStatus === 'completed' && 'Importación completada'}
            {importacionStatus === 'error' && 'Error en importación'}
          </Typography>
        </Box>

        {etapaActual && (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
            {etapaActual}
          </Typography>
        )}

        <LinearProgress 
          variant="determinate" 
          value={progreso} 
          sx={{ 
            height: 8, 
            borderRadius: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: importacionStatus === 'error' ? '#f44336' : '#4fc3f7'
            }
          }} 
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {progreso}% completado
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {calcularTiempoTranscurrido()}s transcurridos
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // 📊 Componente de resumen de resultados
  const ResumenResultados = () => {
    if (!resultados) return null;

    const { estadisticas, exitosos, errores, warnings } = resultados;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#66bb6a', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#66bb6a', fontWeight: 'bold' }}>
                {estadisticas?.creados || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {wizardData.tipo === 'jugadas' ? 'Jugadas' : 'Partidos'} Exitosos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ErrorIcon sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                {estadisticas?.errores || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Errores
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <WarningIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                {warnings?.length || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Advertencias
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: 'rgba(96, 125, 139, 0.1)', border: '1px solid rgba(96, 125, 139, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AssessmentIcon sx={{ fontSize: 40, color: '#90a4ae', mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#90a4ae', fontWeight: 'bold' }}>
                {estadisticas?.total || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Total Procesados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // 📝 Componente de detalles expandibles
  const DetallesResultados = () => {
    if (!resultados) return null;

    const { exitosos, errores, warnings } = resultados;

    return (
      <Grid container spacing={2}>
        {/* Resultados Exitosos */}
        {exitosos && exitosos.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggleSection('exitosos')}
                >
                  <CheckCircleIcon sx={{ mr: 2, color: '#66bb6a' }} />
                  <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                    Registros Exitosos ({exitosos.length})
                  </Typography>
                  {expandedSections.exitosos ? <ExpandLessIcon sx={{ color: 'white' }} /> : <ExpandMoreIcon sx={{ color: 'white' }} />}
                </Box>
                
                <Collapse in={expandedSections.exitosos}>
                  <TableContainer sx={{ mt: 2, maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            Fila
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                            {wizardData.tipo === 'jugadas' ? 'Jugada' : 'Descripción'}
                          </TableCell>
                          {wizardData.tipo === 'jugadas' && (
                            <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              Puntos
                            </TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exitosos.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              {item.fila}
                            </TableCell>
                            <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              {wizardData.tipo === 'jugadas' ? item.jugada : (item.partido || item.descripcion)}
                            </TableCell>
                            {wizardData.tipo === 'jugadas' && (
                              <TableCell sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                                <Chip 
                                  label={item.puntos || 0} 
                                  size="small" 
                                  sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#66bb6a' }}
                                />
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {exitosos.length > 10 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1, display: 'block' }}>
                      Mostrando los primeros 10 de {exitosos.length} registros exitosos
                    </Typography>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Errores */}
        {errores && errores.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
              <CardContent>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggleSection('errores')}
                >
                  <ErrorIcon sx={{ mr: 2, color: '#f44336' }} />
                  <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                    Errores ({errores.length})
                  </Typography>
                  {expandedSections.errores ? <ExpandLessIcon sx={{ color: 'white' }} /> : <ExpandMoreIcon sx={{ color: 'white' }} />}
                </Box>
                
                <Collapse in={expandedSections.errores}>
                  <List sx={{ mt: 1 }}>
                    {errores.slice(0, 10).map((error, index) => (
                      <ListItem key={index} sx={{ py: 1, px: 0 }}>
                        <ListItemIcon>
                          <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              Fila {error.fila}: {error.error}
                            </Typography>
                          }
                          secondary={
                            error.datos && (
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {/* 🔥 MODIFICADO: Mostrar números de jugadores cuando corresponda */}
                                {wizardData.tipo === 'jugadas' && error.datos.numero_jugador_principal && 
                                  `Jugador Principal: #${error.datos.numero_jugador_principal} | `
                                }
                                {wizardData.tipo === 'jugadas' && error.datos.numero_jugador_secundario && 
                                  `Jugador Secundario: #${error.datos.numero_jugador_secundario} | `
                                }
                                {JSON.stringify(error.datos).slice(0, 100)}...
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  {errores.length > 10 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1, display: 'block' }}>
                      Mostrando los primeros 10 de {errores.length} errores
                    </Typography>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Advertencias */}
        {warnings && warnings.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <CardContent>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => toggleSection('warnings')}
                >
                  <WarningIcon sx={{ mr: 2, color: '#ff9800' }} />
                  <Typography variant="h6" sx={{ color: 'white', flex: 1 }}>
                    Advertencias ({warnings.length})
                  </Typography>
                  {expandedSections.warnings ? <ExpandLessIcon sx={{ color: 'white' }} /> : <ExpandMoreIcon sx={{ color: 'white' }} />}
                </Box>
                
                <Collapse in={expandedSections.warnings}>
                  <List sx={{ mt: 1 }}>
                    {warnings.slice(0, 10).map((warning, index) => (
                      <ListItem key={index} sx={{ py: 1, px: 0 }}>
                        <ListItemIcon>
                          <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              Fila {warning.fila}: {warning.mensaje}
                            </Typography>
                          }
                          secondary={
                            warning.datos && (
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {JSON.stringify(warning.datos).slice(0, 100)}...
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  // 🎯 Botones de acción
  const BotonesAccion = () => (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
      {importacionStatus === 'completed' && (
        <>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={reiniciarImportacion}
            sx={{ 
              backgroundColor: '#4fc3f7', 
              '&:hover': { backgroundColor: '#29b6f6' } 
            }}
          >
            Nueva Importación
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={volverAlInicio}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.3)', 
              color: 'white',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Volver al Inicio
          </Button>
        </>
      )}

      {importacionStatus === 'error' && (
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={reiniciarImportacion}
          sx={{ 
            backgroundColor: '#f44336', 
            '&:hover': { backgroundColor: '#d32f2f' } 
          }}
        >
          Reintentar
        </Button>
      )}
    </Box>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* 🔥 NUEVO: Información específica para jugadas */}
        {renderInfoJugadas()}

        {/* Estado de Progreso */}
        <EstadoProgreso />

        {/* Resumen de Resultados */}
        {importacionStatus === 'completed' && <ResumenResultados />}

        {/* Detalles de Resultados */}
        {importacionStatus === 'completed' && <DetallesResultados />}

        {/* Botones de Acción */}
        <BotonesAccion />

        {/* Información adicional para jugadas */}
        {importacionStatus === 'completed' && wizardData.tipo === 'jugadas' && (
          <Card sx={{ 
            mt: 3, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                <TagIcon sx={{ mr: 1 }} />
                Información sobre Números de Jugadores
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                La importación ha sido completada usando el nuevo sistema de números de jugadores:
              </Typography>
              <Box component="ul" sx={{ color: 'rgba(255, 255, 255, 0.7)', pl: 2 }}>
                <li>Se identificaron jugadores por su <strong>número de camiseta</strong> en lugar de nombres</li>
                <li>Los números deben ser únicos dentro de cada equipo</li>
                <li>Este sistema mejora la precisión y velocidad de las estadísticas</li>
                <li>Los datos se validan automáticamente contra el registro de jugadores</li>
              </Box>
              
              {resultados?.errores?.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2, backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
                  <Typography variant="body2">
                    <strong>Errores comunes con números de jugadores:</strong>
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                    <li>Número de jugador no registrado en el equipo</li>
                    <li>Usar nombres en lugar de números</li>
                    <li>Números con formato incorrecto (debe ser entero positivo)</li>
                    <li>Jugador no activo en el equipo especificado</li>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Información de tiempo y rendimiento */}
        {(importacionStatus === 'completed' || importacionStatus === 'error') && (
          <Card sx={{ 
            mt: 2, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            border: '1px solid rgba(255, 255, 255, 0.1)' 
          }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <TimelineIcon sx={{ fontSize: 30, color: '#90a4ae', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Tiempo Total
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {calcularTiempoTranscurrido()}s
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SpeedIcon sx={{ fontSize: 30, color: '#90a4ae', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Velocidad
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {resultados?.estadisticas?.total && calcularTiempoTranscurrido() > 0 
                        ? Math.round(resultados.estadisticas.total / calcularTiempoTranscurrido()) 
                        : 0} reg/s
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AssessmentIcon sx={{ fontSize: 30, color: '#90a4ae', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Eficiencia
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'white' }}>
                      {resultados?.estadisticas?.total > 0 
                        ? Math.round(((resultados.estadisticas.creados || 0) / resultados.estadisticas.total) * 100)
                        : 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </motion.div>
  );
};