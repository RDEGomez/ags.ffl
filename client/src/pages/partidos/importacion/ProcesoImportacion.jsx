// 📁 client/src/pages/partidos/importacion/ProcesoImportacion.jsx
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
  Home as HomeIcon
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

      // Preparar archivo para envío
      const archivo = prepararArchivoCSV();
      
      // Configurar request
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const resultadosImportacion = await response.json();
      
      setProgreso(100);
      setEtapaActual('Importación completada');
      setTiempoFin(new Date());
      setResultados(resultadosImportacion.resultados);
      setImportacionStatus('completed');

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
      setError(`Error al importar ${wizardData.tipo}: ${error.message}`);
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
    const etapas = [
      { texto: 'Preparando datos...', progreso: 10, tiempo: 800 },
      { texto: 'Validando formato...', progreso: 25, tiempo: 600 },
      { texto: 'Mapeando columnas...', progreso: 40, tiempo: 500 },
      { texto: 'Verificando consistencia...', progreso: 55, tiempo: 700 }
    ];

    for (const etapa of etapas) {
      setEtapaActual(etapa.texto);
      setProgreso(etapa.progreso);
      await new Promise(resolve => setTimeout(resolve, etapa.tiempo));
    }
  };

  // 🔄 Reiniciar importación
  const reiniciarImportacion = () => {
    setImportacionStatus('idle');
    setProgreso(0);
    setEtapaActual('');
    setResultados(null);
    setTiempoInicio(null);
    setTiempoFin(null);
    hasExecutedRef.current = false; // ← Resetear para permitir nueva ejecución
    setTimeout(() => iniciarImportacion(), 500);
  };

  // 📊 Calcular estadísticas de tiempo
  const calcularTiempoTranscurrido = () => {
    if (!tiempoInicio) return '0s';
    const tiempoFinal = tiempoFin || new Date();
    const diferencia = Math.round((tiempoFinal - tiempoInicio) / 1000);
    
    if (diferencia < 60) return `${diferencia}s`;
    const minutos = Math.floor(diferencia / 60);
    const segundos = diferencia % 60;
    return `${minutos}m ${segundos}s`;
  };

  // 🎨 Toggle secciones
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 📊 Componente de tarjeta estadística
  const StatCard = ({ title, value, color, icon, subtitle, onClick }) => (
    <Card 
      sx={{
        backgroundColor: `rgba(${
          color === 'success' ? '76, 175, 80' :
          color === 'error' ? '244, 67, 54' :
          color === 'warning' ? '255, 152, 0' :
          '33, 150, 243'
        }, 0.1)`,
        border: `1px solid rgba(${
          color === 'success' ? '76, 175, 80' :
          color === 'error' ? '244, 67, 54' :
          color === 'warning' ? '255, 152, 0' :
          '33, 150, 243'
        }, 0.3)`,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'scale(1.02)' } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          {icon}
          <Typography variant="h4" sx={{ 
            ml: 1,
            color: color === 'success' ? '#4caf50' :
                   color === 'error' ? '#f44336' :
                   color === 'warning' ? '#ff9800' :
                   '#2196f3',
            fontWeight: 'bold'
          }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // 📋 Renderizar tabla de resultados
  const renderTablaResultados = (datos, tipo, color) => {
    if (!datos || datos.length === 0) return null;

    return (
      <TableContainer sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                Fila
              </TableCell>
              {tipo === 'exitosos' && (
                <>
                  <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                    ID Creado
                  </TableCell>
                  <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                    Descripción
                  </TableCell>
                  <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                    Estado
                  </TableCell>
                </>
              )}
              {tipo === 'errores' && (
                <>
                  <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                    Error
                  </TableCell>
                  <TableCell sx={{ backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})`, fontWeight: 'bold' }}>
                    Datos
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {datos.slice(0, 10).map((item, index) => (
              <TableRow key={index}>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {item.fila}
                </TableCell>
                {tipo === 'exitosos' && (
                  <>
                    <TableCell sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem'
                    }}>
                      {item.partidoId || item.jugadaId || item.id || '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.equipos || item.jugada || item.descripcion || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Creado" 
                        color="success" 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </>
                )}
                {tipo === 'errores' && (
                  <>
                    <TableCell sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.error}
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {JSON.stringify(item.datos).substring(0, 50)}...
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {datos.length > 10 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Mostrando 10 de {datos.length} registros
            </Typography>
          </Box>
        )}
      </TableContainer>
    );
  };

  // 📊 Función para descargar reporte
  const descargarReporte = () => {
    if (!resultados) return;

    const reporte = {
      fecha: new Date().toISOString(),
      tipo: wizardData.tipo,
      duracion: calcularTiempoTranscurrido(),
      estadisticas: {
        total: resultados.estadisticas?.total || 0,
        procesados: resultados.estadisticas?.procesados || 0,
        creados: resultados.estadisticas?.creados || 0,
        errores: resultados.errores?.length || 0,
        warnings: resultados.warnings?.length || 0,
        tasaExito: Math.round(((resultados.exitosos?.length || 0) / Math.max(1, resultados.estadisticas?.procesados || 1)) * 100)
      },
      detalles: {
        exitosos: resultados.exitosos || [],
        errores: resultados.errores || [],
        warnings: resultados.warnings || []
      }
    };

    const blob = new Blob([JSON.stringify(reporte, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_importacion_${wizardData.tipo}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 📤 Función para compartir resultados
  const compartirResultados = () => {
    if (!resultados) return;

    const resumen = `🏈 Importación ${wizardData.tipo} completada
✅ ${resultados.exitosos?.length || 0} exitosos
❌ ${resultados.errores?.length || 0} errores  
⚠️ ${resultados.warnings?.length || 0} advertencias
⏱️ Tiempo: ${calcularTiempoTranscurrido()}
📊 Tasa de éxito: ${Math.round(((resultados.exitosos?.length || 0) / Math.max(1, resultados.estadisticas?.procesados || 1)) * 100)}%`;

    if (navigator.share) {
      navigator.share({
        title: 'Resultados de Importación AGS FFL',
        text: resumen
      });
    } else {
      navigator.clipboard.writeText(resumen).then(() => {
        console.log('Resultados copiados al portapapeles');
      });
    }
  };

  return (
    <Box>
      {/* Estado de importación */}
      {importacionStatus === 'processing' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: 3,
            p: 4,
            mb: 4,
            textAlign: 'center'
          }}>
            <CircularProgress 
              size={80} 
              thickness={4}
              sx={{ 
                color: '#64b5f6',
                mb: 3
              }}
            />
            
            <Typography variant="h5" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              mb: 2
            }}>
              Importando {wizardData.tipo}...
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 3
            }}>
              {etapaActual}
            </Typography>

            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progreso}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  }
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {progreso}% completado • Tiempo transcurrido: {calcularTiempoTranscurrido()}
            </Typography>

            <Button
              variant="outlined"
              startIcon={<StopIcon />}
              onClick={() => setImportacionStatus('idle')}
              sx={{
                mt: 3,
                borderColor: 'rgba(244, 67, 54, 0.3)',
                color: '#f44336',
                '&:hover': {
                  borderColor: 'rgba(244, 67, 54, 0.5)',
                  backgroundColor: 'rgba(244, 67, 54, 0.05)'
                }
              }}
            >
              Cancelar
            </Button>
          </Paper>
        </motion.div>
      )}

      {/* Resultados de importación */}
      {importacionStatus === 'completed' && resultados && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header de éxito */}
          <Alert 
            severity="success" 
            sx={{ 
              mb: 4,
              fontSize: '1.1rem',
              '& .MuiAlert-icon': {
                fontSize: '2rem'
              }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              🎉 ¡Importación completada exitosamente!
            </Typography>
            <Typography variant="body2">
              Se procesaron {resultados.estadisticas?.procesados || 0} registros en {calcularTiempoTranscurrido()}.
              {resultados.estadisticas?.creados > 0 && ` ${resultados.estadisticas.creados} ${wizardData.tipo} fueron creados.`}
            </Typography>
          </Alert>

          {/* Resumen estadístico */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <StatCard
                title="Exitosos"
                value={resultados.exitosos?.length || 0}
                color="success"
                icon={<CheckCircleIcon />}
                subtitle="Registros creados"
                onClick={() => toggleSection('exitosos')}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Errores"
                value={resultados.errores?.length || 0}
                color="error"
                icon={<ErrorIcon />}
                subtitle="No procesados"
                onClick={() => toggleSection('errores')}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Advertencias"
                value={resultados.warnings?.length || 0}
                color="warning"
                icon={<WarningIcon />}
                subtitle="Revisar"
                onClick={() => toggleSection('warnings')}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Tiempo"
                value={calcularTiempoTranscurrido()}
                color="info"
                icon={<SpeedIcon />}
                subtitle="Duración total"
              />
            </Grid>
          </Grid>

          {/* Detalles de registros exitosos */}
          {resultados.exitosos && resultados.exitosos.length > 0 && (
            <Paper sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
              }}>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  ✅ Registros Creados Exitosamente ({resultados.exitosos.length})
                </Typography>
                <IconButton
                  onClick={() => toggleSection('exitosos')}
                  sx={{ color: '#4caf50' }}
                >
                  {expandedSections.exitosos ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.exitosos}>
                {renderTablaResultados(resultados.exitosos, 'exitosos', '76, 175, 80')}
              </Collapse>
            </Paper>
          )}

          {/* Detalles de errores */}
          {resultados.errores && resultados.errores.length > 0 && (
            <Paper sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(244, 67, 54, 0.2)'
              }}>
                <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  ❌ Registros con Errores ({resultados.errores.length})
                </Typography>
                <IconButton
                  onClick={() => toggleSection('errores')}
                  sx={{ color: '#f44336' }}
                >
                  {expandedSections.errores ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.errores}>
                {renderTablaResultados(resultados.errores, 'errores', '244, 67, 54')}
              </Collapse>
            </Paper>
          )}

          {/* Detalles de advertencias */}
          {resultados.warnings && resultados.warnings.length > 0 && (
            <Paper sx={{
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: 2,
              mb: 3
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(255, 152, 0, 0.2)'
              }}>
                <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                  ⚠️ Advertencias ({resultados.warnings.length})
                </Typography>
                <IconButton
                  onClick={() => toggleSection('warnings')}
                  sx={{ color: '#ff9800' }}
                >
                  {expandedSections.warnings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.warnings}>
                <List>
                  {resultados.warnings.slice(0, 5).map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon sx={{ color: '#ff9800' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Fila ${warning.fila}: ${warning.mensaje}`}
                        secondary={warning.datos ? JSON.stringify(warning.datos).substring(0, 100) + '...' : ''}
                        primaryTypographyProps={{
                          sx: { color: 'rgba(255, 255, 255, 0.9)' }
                        }}
                        secondaryTypographyProps={{
                          sx: { color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Paper>
          )}

          {/* Resumen detallado */}
          <Paper sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mb: 4
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                📊 Resumen Detallado
              </Typography>
              <IconButton
                onClick={() => toggleSection('resumen')}
                sx={{ color: 'white' }}
              >
                {expandedSections.resumen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.resumen}>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                      Información del Proceso
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <AssessmentIcon sx={{ color: '#64b5f6' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tipo de importación"
                          secondary={wizardData.tipo === 'partidos' ? 'Partidos' : 'Jugadas'}
                          primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                          secondaryTypographyProps={{ sx: { color: 'white', fontWeight: 'bold' } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <TimelineIcon sx={{ color: '#64b5f6' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tiempo de procesamiento"
                          secondary={calcularTiempoTranscurrido()}
                          primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                          secondaryTypographyProps={{ sx: { color: 'white', fontWeight: 'bold' } }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <SpeedIcon sx={{ color: '#64b5f6' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Velocidad de procesamiento"
                          secondary={`${Math.round((resultados.estadisticas?.procesados || 0) / Math.max(1, (tiempoFin - tiempoInicio) / 1000))} registros/seg`}
                          primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                         secondaryTypographyProps={{ sx: { color: 'white', fontWeight: 'bold' } }}
                       />
                     </ListItem>
                   </List>
                 </Grid>

                 <Grid item xs={12} md={6}>
                   <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                     Estadísticas
                   </Typography>
                   <List dense>
                     <ListItem>
                       <ListItemText
                         primary="Tasa de éxito"
                         secondary={`${Math.round(((resultados.exitosos?.length || 0) / Math.max(1, resultados.estadisticas?.procesados || 1)) * 100)}%`}
                         primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                         secondaryTypographyProps={{ sx: { color: '#4caf50', fontWeight: 'bold', fontSize: '1.2rem' } }}
                       />
                     </ListItem>
                     <ListItem>
                       <ListItemText
                         primary="Registros procesados"
                         secondary={`${resultados.estadisticas?.procesados || 0} de ${resultados.estadisticas?.total || 0}`}
                         primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                         secondaryTypographyProps={{ sx: { color: 'white', fontWeight: 'bold' } }}
                       />
                     </ListItem>
                     <ListItem>
                       <ListItemText
                         primary="Eficiencia"
                         secondary={resultados.errores?.length === 0 ? 'Perfecta' : 'Con errores menores'}
                         primaryTypographyProps={{ sx: { color: 'rgba(255, 255, 255, 0.7)' } }}
                         secondaryTypographyProps={{ 
                           sx: { 
                             color: resultados.errores?.length === 0 ? '#4caf50' : '#ff9800', 
                             fontWeight: 'bold' 
                           } 
                         }}
                       />
                     </ListItem>
                   </List>
                 </Grid>
               </Grid>
             </Box>
           </Collapse>
         </Paper>

         {/* Acciones post-importación */}
         <Paper sx={{
           backgroundColor: 'rgba(33, 150, 243, 0.1)',
           border: '1px solid rgba(33, 150, 243, 0.2)',
           borderRadius: 2,
           p: 3,
           mb: 4
         }}>
           <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
             🎯 ¿Qué hacer ahora?
           </Typography>

           <Grid container spacing={2}>
             <Grid item xs={12} md={3}>
               <Button
                 variant="contained"
                 fullWidth
                 startIcon={<HomeIcon />}
                 onClick={() => navigate('/partidos')}
                 sx={{
                   background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                   boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                   py: 1.5
                 }}
               >
                 Ver Partidos
               </Button>
             </Grid>

             <Grid item xs={12} md={3}>
               <Button
                 variant="outlined"
                 fullWidth
                 startIcon={<FileDownloadIcon />}
                 onClick={descargarReporte}
                 sx={{
                   borderColor: 'rgba(76, 175, 80, 0.3)',
                   color: '#4caf50',
                   '&:hover': {
                     borderColor: 'rgba(76, 175, 80, 0.5)',
                     backgroundColor: 'rgba(76, 175, 80, 0.05)'
                   },
                   py: 1.5
                 }}
               >
                 Descargar Reporte
               </Button>
             </Grid>

             <Grid item xs={12} md={3}>
               <Button
                 variant="outlined"
                 fullWidth
                 startIcon={<RefreshIcon />}
                 onClick={reiniciarImportacion}
                 sx={{
                   borderColor: 'rgba(255, 152, 0, 0.3)',
                   color: '#ff9800',
                   '&:hover': {
                     borderColor: 'rgba(255, 152, 0, 0.5)',
                     backgroundColor: 'rgba(255, 152, 0, 0.05)'
                   },
                   py: 1.5
                 }}
               >
                 Nueva Importación
               </Button>
             </Grid>

             <Grid item xs={12} md={3}>
               <Button
                 variant="outlined"
                 fullWidth
                 startIcon={<ShareIcon />}
                 onClick={compartirResultados}
                 sx={{
                   borderColor: 'rgba(156, 39, 176, 0.3)',
                   color: '#9c27b0',
                   '&:hover': {
                     borderColor: 'rgba(156, 39, 176, 0.5)',
                     backgroundColor: 'rgba(156, 39, 176, 0.05)'
                   },
                   py: 1.5
                 }}
               >
                 Compartir
               </Button>
             </Grid>
           </Grid>
         </Paper>
       </motion.div>
     )}

     {/* Estado de error */}
     {importacionStatus === 'error' && (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
       >
         <Alert 
           severity="error" 
           sx={{ 
             mb: 4,
             fontSize: '1.1rem'
           }}
         >
           <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
             ❌ Error en la importación
           </Typography>
           <Typography variant="body2">
             Ocurrió un problema durante el proceso. Revisa los datos y vuelve a intentar.
           </Typography>
         </Alert>

         <Box sx={{ textAlign: 'center', py: 4 }}>
           <ErrorIcon sx={{ fontSize: 100, color: '#f44336', mb: 3 }} />
           
           <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
             No se pudo completar la importación
           </Typography>
           
           <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
             Tiempo transcurrido: {calcularTiempoTranscurrido()}
           </Typography>

           <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
             <Button
               variant="contained"
               startIcon={<RefreshIcon />}
               onClick={reiniciarImportacion}
               sx={{
                 background: 'linear-gradient(45deg, #f44336 30%, #f66 90%)',
                 boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)'
               }}
             >
               Reintentar
             </Button>
             
             <Button
               variant="outlined"
               startIcon={<HomeIcon />}
               onClick={() => navigate('/partidos')}
               sx={{
                 borderColor: 'rgba(255, 255, 255, 0.3)',
                 color: 'rgba(255, 255, 255, 0.7)',
                 '&:hover': {
                   borderColor: 'rgba(255, 255, 255, 0.5)',
                   backgroundColor: 'rgba(255, 255, 255, 0.05)'
                 }
               }}
             >
               Volver al Inicio
             </Button>
           </Box>
         </Box>
       </motion.div>
     )}

     {/* Estado inicial - Esperando */}
     {importacionStatus === 'idle' && (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ duration: 0.5 }}
       >
         <Box sx={{ textAlign: 'center', py: 8 }}>
           <CloudUploadIcon sx={{ fontSize: 100, color: 'rgba(255, 255, 255, 0.3)', mb: 3 }} />
           
           <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
             Listo para importar
           </Typography>
           
           <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
             {wizardData.validationResults?.resumen?.validos || 0} registros válidos están listos para ser procesados
           </Typography>

           <Button
             variant="contained"
             size="large"
             startIcon={<PlayArrowIcon />}
             onClick={iniciarImportacion}
             sx={{
               background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
               boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
               px: 6,
               py: 2,
               fontSize: '1.1rem',
               fontWeight: 'bold'
             }}
           >
             Iniciar Importación
           </Button>
         </Box>
       </motion.div>
     )}
   </Box>
 );
};