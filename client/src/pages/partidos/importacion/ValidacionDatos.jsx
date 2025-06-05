// 📁 client/src/pages/partidos/importacion/ValidacionDatos.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  BugReport as BugReportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export const ValidacionDatos = ({ wizardData, updateWizardData, setLoading, setError, onNext }) => {
  const [validationResults, setValidationResults] = useState(null);
  const [validating, setValidating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    errores: true,
    warnings: false,
    preview: false,
    estadisticas: false
  });

  // 🔍 Ejecutar validación automáticamente
  // REEMPLAZAR useEffect completo por:
  useEffect(() => {
    // Solo ejecutar si tenemos datos necesarios y NO hay resultados previos
    if (wizardData.csvData && 
        wizardData.mappings && 
        Object.keys(wizardData.mappings).length > 0 &&
        !wizardData.validationResults && // ← Verificar en wizardData en lugar de local state
        !validating) {
      ejecutarValidacion();
    }
  }, [wizardData.csvData]); // ← QUITAR wizardData.mappings de las dependencias

  // ✅ Ejecutar validación completa
  const ejecutarValidacion = async () => {
    setValidating(true);
    setLoading(true);

    try {
      console.log('🔍 Iniciando validación de datos...');
      
      // Simular delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      const results = await validarDatos(wizardData.csvData, wizardData.mappings, wizardData.tipo);
      
      setValidationResults(results);
      updateWizardData({ validationResults: results });

      console.log('✅ Validación completada:', results);

    } catch (error) {
      console.error('❌ Error en validación:', error);
      setError('Error al validar los datos: ' + error.message);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  // 🎯 Lógica de validación principal
  const validarDatos = async (csvData, mappings, tipo) => {
    const resultados = {
      resumen: {
        total: csvData.length,
        validos: 0,
        errores: 0,
        warnings: 0
      },
      detalles: [],
      preview: [],
      estadisticas: {},
      puedeImportar: false
    };

    // Procesar cada fila
    for (let i = 0; i < csvData.length; i++) {
      const fila = csvData[i];
      const numeroFila = i + 1;
      const erroresFila = [];
      const warningsFila = [];

      // Mapear datos según el mapeo definido
      const dataMapeada = {};
      Object.entries(mappings).forEach(([campo, header]) => {
        if (header && fila[header] !== undefined) {
          dataMapeada[campo] = fila[header];
        }
      });

      // Validaciones según el tipo
      if (tipo === 'partidos') {
        validarPartido(dataMapeada, numeroFila, erroresFila, warningsFila);
      } else if (tipo === 'jugadas') {
        validarJugada(dataMapeada, numeroFila, erroresFila, warningsFila);
      }

      // Agregar errores y warnings al resultado
      erroresFila.forEach(error => {
        resultados.detalles.push({
          fila: numeroFila,
          tipo: 'error',
          campo: error.campo,
          mensaje: error.mensaje,
          valor: error.valor,
          sugerencia: error.sugerencia,
          datos: dataMapeada
        });
        resultados.resumen.errores++;
      });

      warningsFila.forEach(warning => {
        resultados.detalles.push({
          fila: numeroFila,
          tipo: 'warning',
          campo: warning.campo,
          mensaje: warning.mensaje,
          valor: warning.valor,
          sugerencia: warning.sugerencia,
          datos: dataMapeada
        });
        resultados.resumen.warnings++;
      });

      // Contar válidos
      if (erroresFila.length === 0) {
        resultados.resumen.validos++;
      }

      // Agregar preview (primeras 5 filas válidas)
      if (resultados.preview.length < 5 && erroresFila.length === 0) {
        resultados.preview.push({
          fila: numeroFila,
          datos: dataMapeada
        });
      }
    }

    // Calcular estadísticas
    resultados.estadisticas = calcularEstadisticas(csvData, mappings, tipo);
    
    // Determinar si se puede importar
    resultados.puedeImportar = resultados.resumen.errores === 0 && resultados.resumen.validos > 0;

    return resultados;
  };

  // 🏈 Validar datos de partido
  const validarPartido = (data, numeroFila, errores, warnings) => {
    // Campos requeridos
    const camposRequeridos = ['equipo_local', 'equipo_visitante', 'torneo', 'fecha_hora'];
    
    camposRequeridos.forEach(campo => {
      if (!data[campo] || data[campo].toString().trim() === '') {
        errores.push({
          campo,
          mensaje: 'Campo requerido faltante',
          valor: data[campo] || '',
          sugerencia: 'Este campo es obligatorio'
        });
      }
    });

    // Validar que no sea el mismo equipo
    if (data.equipo_local && data.equipo_visitante) {
      if (data.equipo_local.toLowerCase().trim() === data.equipo_visitante.toLowerCase().trim()) {
        errores.push({
          campo: 'equipos',
          mensaje: 'Un equipo no puede jugar contra sí mismo',
          valor: `${data.equipo_local} vs ${data.equipo_visitante}`,
          sugerencia: 'Verificar nombres de equipos'
        });
      }
    }

    // Validar formato de fecha
    if (data.fecha_hora) {
      const fecha = new Date(data.fecha_hora);
      if (isNaN(fecha.getTime())) {
        errores.push({
          campo: 'fecha_hora',
          mensaje: 'Formato de fecha inválido',
          valor: data.fecha_hora,
          sugerencia: 'Usar formato: YYYY-MM-DD HH:MM'
        });
      } else {
        // Validar que la fecha no sea muy antigua o muy futura
        const ahora = new Date();
        const unAnoAtras = new Date(ahora.getFullYear() - 1, 0, 1);
        const unAnoAdelante = new Date(ahora.getFullYear() + 1, 11, 31);
        
        if (fecha < unAnoAtras) {
          warnings.push({
            campo: 'fecha_hora',
            mensaje: 'Fecha muy antigua',
            valor: data.fecha_hora,
            sugerencia: 'Verificar si es correcta'
          });
        } else if (fecha > unAnoAdelante) {
          warnings.push({
            campo: 'fecha_hora',
            mensaje: 'Fecha muy futura',
            valor: data.fecha_hora,
            sugerencia: 'Verificar si es correcta'
          });
        }
      }
    }

    // Validar estado
    if (data.estado) {
      const estadosValidos = ['programado', 'en_curso', 'medio_tiempo', 'finalizado', 'suspendido', 'cancelado'];
      if (!estadosValidos.includes(data.estado.toLowerCase())) {
        errores.push({
          campo: 'estado',
          mensaje: 'Estado inválido',
          valor: data.estado,
          sugerencia: `Estados válidos: ${estadosValidos.join(', ')}`
        });
      }
    }

    // Validar marcadores
    if (data.marcador_local !== undefined && data.marcador_local !== null) {
      const marcador = parseInt(data.marcador_local);
      if (isNaN(marcador) || marcador < 0) {
        errores.push({
          campo: 'marcador_local',
          mensaje: 'Marcador inválido',
          valor: data.marcador_local,
          sugerencia: 'Debe ser un número mayor o igual a 0'
        });
      }
    }

    if (data.marcador_visitante !== undefined && data.marcador_visitante !== null) {
      const marcador = parseInt(data.marcador_visitante);
      if (isNaN(marcador) || marcador < 0) {
        errores.push({
          campo: 'marcador_visitante',
          mensaje: 'Marcador inválido',
          valor: data.marcador_visitante,
          sugerencia: 'Debe ser un número mayor o igual a 0'
        });
      }
    }

    // Validar duración
    if (data.duracion_minutos) {
      const duracion = parseInt(data.duracion_minutos);
      if (isNaN(duracion) || duracion <= 0 || duracion > 180) {
        warnings.push({
          campo: 'duracion_minutos',
          mensaje: 'Duración inusual',
          valor: data.duracion_minutos,
          sugerencia: 'Típicamente entre 40-60 minutos'
        });
      }
    }
  };

  // 🎮 Validar datos de jugada
  const validarJugada = (data, numeroFila, errores, warnings) => {
    // Campos requeridos
    const camposRequeridos = ['partido_id', 'tipo_jugada', 'equipo_posesion', 'jugador_principal'];
    
    camposRequeridos.forEach(campo => {
      if (!data[campo] || data[campo].toString().trim() === '') {
        errores.push({
          campo,
          mensaje: 'Campo requerido faltante',
          valor: data[campo] || '',
          sugerencia: 'Este campo es obligatorio'
        });
      }
    });

    // Validar ObjectId del partido
    if (data.partido_id) {
      if (!/^[0-9a-fA-F]{24}$/.test(data.partido_id)) {
        errores.push({
          campo: 'partido_id',
          mensaje: 'ID de partido inválido',
          valor: data.partido_id,
          sugerencia: 'Debe ser un ObjectId válido de 24 caracteres'
        });
      }
    }

    // Validar tiempo
    if (data.minuto !== undefined && data.minuto !== null) {
      const minuto = parseInt(data.minuto);
      if (isNaN(minuto) || minuto < 0 || minuto > 60) {
        warnings.push({
          campo: 'minuto',
          mensaje: 'Minuto inusual',
          valor: data.minuto,
          sugerencia: 'Típicamente entre 0-50'
        });
      }
    }

    if (data.segundo !== undefined && data.segundo !== null) {
      const segundo = parseInt(data.segundo);
      if (isNaN(segundo) || segundo < 0 || segundo >= 60) {
        errores.push({
          campo: 'segundo',
          mensaje: 'Segundo inválido',
          valor: data.segundo,
          sugerencia: 'Debe estar entre 0-59'
        });
      }
    }

    if (data.periodo !== undefined && data.periodo !== null) {
      const periodo = parseInt(data.periodo);
      if (isNaN(periodo) || periodo < 1 || periodo > 2) {
        warnings.push({
          campo: 'periodo',
          mensaje: 'Período inusual',
          valor: data.periodo,
          sugerencia: 'Típicamente 1 o 2'
        });
      }
    }

    // Validar puntos
    if (data.puntos !== undefined && data.puntos !== null) {
      const puntos = parseInt(data.puntos);
      if (isNaN(puntos) || puntos < 0 || puntos > 6) {
        warnings.push({
          campo: 'puntos',
          mensaje: 'Puntos inusuales',
          valor: data.puntos,
          sugerencia: 'Típicamente entre 0-6'
        });
      }
    }

    // Validar booleanos
    ['touchdown', 'intercepcion', 'sack'].forEach(campo => {
      if (data[campo] !== undefined && data[campo] !== null) {
        const valor = data[campo].toString().toLowerCase();
        if (!['true', 'false', '1', '0', 'si', 'no', 'yes', 'no'].includes(valor)) {
          warnings.push({
            campo,
            mensaje: 'Valor booleano incierto',
            valor: data[campo],
            sugerencia: 'Use: true/false, 1/0, si/no'
          });
        }
      }
    });
  };

  // 📊 Calcular estadísticas adicionales
  const calcularEstadisticas = (csvData, mappings, tipo) => {
    const stats = {
      coberturaCampos: {},
      distribucionValores: {},
      recomendaciones: []
    };

    // Calcular cobertura de campos
    Object.keys(mappings).forEach(campo => {
      const header = mappings[campo];
      if (header) {
        const valoresNoVacios = csvData.filter(fila => 
          fila[header] !== undefined && 
          fila[header] !== null && 
          fila[header].toString().trim() !== ''
        ).length;
        
        stats.coberturaCampos[campo] = {
          total: csvData.length,
          completos: valoresNoVacios,
          porcentaje: Math.round((valoresNoVacios / csvData.length) * 100)
        };
      }
    });

    // Generar recomendaciones
    if (tipo === 'partidos') {
      // Verificar si hay muchos partidos sin árbitro
      const sinArbitro = stats.coberturaCampos.arbitro_principal?.porcentaje || 0;
      if (sinArbitro < 50) {
        stats.recomendaciones.push({
          tipo: 'info',
          mensaje: 'Muchos partidos sin árbitro asignado',
          accion: 'Considera agregar árbitros posteriormente'
        });
      }

      // Verificar distribución de fechas
      const fechasCompletas = stats.coberturaCampos.fecha_hora?.porcentaje || 0;
      if (fechasCompletas < 100) {
        stats.recomendaciones.push({
          tipo: 'warning',
          mensaje: 'Faltan fechas en algunos partidos',
          accion: 'Revisa los datos antes de importar'
        });
      }
    }

    return stats;
  };

  // 🔄 Toggle secciones expandidas
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 🎨 Renderizar tarjeta de estadística
  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <Card sx={{
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
      borderRadius: 2
    }}>
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

  // 🚫 Si no hay datos para validar
  if (!wizardData.csvData || !wizardData.mappings) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <BugReportIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          No hay datos para validar
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Completa los pasos anteriores primero
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con botón de re-validación */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          Validación de Datos
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={ejecutarValidacion}
          disabled={validating}
          sx={{
            borderColor: 'rgba(100, 181, 246, 0.3)',
            color: '#64b5f6',
            '&:hover': {
              borderColor: 'rgba(100, 181, 246, 0.5)',
              backgroundColor: 'rgba(100, 181, 246, 0.05)'
            }
          }}
        >
          Re-validar
        </Button>
      </Box>

      {/* Barra de progreso durante validación */}
      <AnimatePresence>
        {validating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                Validando datos...
              </Typography>
              <LinearProgress
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: '#64b5f6'
                  }
                }}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados de validación */}
      {validationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Resumen estadístico */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <StatCard
                title="Filas Válidas"
                value={validationResults.resumen.validos}
                color="success"
                icon={<CheckCircleIcon />}
                subtitle={`${Math.round((validationResults.resumen.validos / validationResults.resumen.total) * 100)}%`}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Errores"
                value={validationResults.resumen.errores}
                color="error"
                icon={<ErrorIcon />}
                subtitle={validationResults.resumen.errores > 0 ? 'Requieren corrección' : 'Todo bien'}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Advertencias"
                value={validationResults.resumen.warnings}
                color="warning"
                icon={<WarningIcon />}
                subtitle={validationResults.resumen.warnings > 0 ? 'Revisar' : 'Sin problemas'}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <StatCard
                title="Total Filas"
                value={validationResults.resumen.total}
                color="info"
                icon={<AssignmentIcon />}
                subtitle={`${wizardData.tipo} para importar`}
              />
            </Grid>
          </Grid>

          {/* Estado general */}
          <Alert 
            severity={validationResults.puedeImportar ? 'success' : 'error'}
            sx={{ mb: 4 }}
          >
            {validationResults.puedeImportar ? (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ✅ Datos listos para importar
                </Typography>
                <Typography variant="body2">
                  {validationResults.resumen.validos} de {validationResults.resumen.total} filas pasaron la validación.
                  {validationResults.resumen.warnings > 0 && ` ${validationResults.resumen.warnings} advertencias encontradas.`}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ❌ Errores encontrados - No se puede importar
                </Typography>
                <Typography variant="body2">
                  {validationResults.resumen.errores} errores deben ser corregidos antes de continuar.
                </Typography>
              </Box>
            )}
          </Alert>

          {/* Detalles de errores y warnings */}
          {validationResults.detalles.length > 0 && (
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
                  Detalles de Validación
                </Typography>
                <IconButton
                  onClick={() => toggleSection('errores')}
                  sx={{ color: 'white' }}
                >
                  {expandedSections.errores ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.errores}>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Fila
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Tipo
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Campo
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Problema
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Valor
                        </TableCell>
                        <TableCell sx={{ backgroundColor: 'rgba(100, 181, 246, 0.1)', color: '#64b5f6', fontWeight: 'bold' }}>
                          Sugerencia
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResults.detalles.map((detalle, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {detalle.fila}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={detalle.tipo}
                              color={detalle.tipo === 'error' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {detalle.campo}
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {detalle.mensaje}
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'monospace',
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {detalle.valor || '—'}
                          </TableCell>
                          <TableCell sx={{ 
                            color: 'rgba(100, 181, 246, 0.8)',
                            fontSize: '0.85rem'
                          }}>
                            {detalle.sugerencia}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          )}

          {/* Preview de datos válidos */}
          {validationResults.preview.length > 0 && (
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
                  Preview de Datos Válidos
                </Typography>
                <IconButton
                  onClick={() => toggleSection('preview')}
                  sx={{ color: 'white' }}
                >
                  {expandedSections.preview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.preview}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontWeight: 'bold' }}>
                          Fila
                        </TableCell>
                        {Object.keys(validationResults.preview[0]?.datos || {}).map(campo => (
                          <TableCell 
                            key={campo}
                            sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontWeight: 'bold' }}
                          >
                            {campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResults.preview.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {item.fila}
                          </TableCell>
                          {Object.values(item.datos).map((valor, valorIndex) => (
                            <TableCell 
                              key={valorIndex}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {valor !== null && valor !== undefined ? String(valor) : '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          )}

          {/* Estadísticas detalladas */}
          {validationResults.estadisticas && (
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
                  Estadísticas Avanzadas
                </Typography>
                <IconButton
                  onClick={() => toggleSection('estadisticas')}
                  sx={{ color: 'white' }}
                >
                  {expandedSections.estadisticas ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.estadisticas}>
                <Box sx={{ p: 3 }}>
                  {/* Cobertura de campos */}
                  <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                    Cobertura de Campos
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {Object.entries(validationResults.estadisticas.coberturaCampos || {}).map(([campo, stats]) => (
                      <Grid item xs={12} md={6} key={campo}>
                        <Box sx={{ 
                          p: 2,
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 1,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: stats.porcentaje === 100 ? '#4caf50' : 
                                     stats.porcentaje >= 80 ? '#ff9800' : '#f44336',
                              fontWeight: 'bold'
                            }}>
                              {stats.porcentaje}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={stats.porcentaje}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: stats.porcentaje === 100 ? '#4caf50' : 
                                               stats.porcentaje >= 80 ? '#ff9800' : '#f44336'
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {stats.completos} de {stats.total} filas completas
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Recomendaciones */}
                  {validationResults.estadisticas.recomendaciones && validationResults.estadisticas.recomendaciones.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                        Recomendaciones
                      </Typography>
                      
                      <List>
                        {validationResults.estadisticas.recomendaciones.map((rec, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              {rec.tipo === 'error' ? (
                                <ErrorIcon sx={{ color: '#f44336' }} />
                              ) : rec.tipo === 'warning' ? (
                                <WarningIcon sx={{ color: '#ff9800' }} />
                              ) : (
                                <InfoIcon sx={{ color: '#64b5f6' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={rec.mensaje}
                              secondary={rec.accion}
                              primaryTypographyProps={{
                                sx: { color: 'white' }
                              }}
                              secondaryTypographyProps={{
                                sx: { color: 'rgba(255, 255, 255, 0.7)' }
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          )}

          {/* Botón para continuar */}
          {validationResults.puedeImportar && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
                  onClick={onNext}
                  startIcon={<SpeedIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                    boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Datos Validados - Proceder a Importar
                </Button>
              </Box>
            </motion.div>
          )}

          {/* Información adicional */}
          <Paper sx={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: 2,
            p: 3,
            mt: 4
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 2 
            }}>
              <TrendingUpIcon sx={{ color: '#64b5f6' }} />
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}>
                Información de Validación
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <strong style={{color: '#64b5f6'}}>Errores:</strong> Deben corregirse antes de importar. Estos datos no se procesarán.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <strong style={{color: '#ff9800'}}>Advertencias:</strong> Datos inusuales pero válidos. Se importarán pero revisa si son correctos.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  <strong style={{color: '#4caf50'}}>Válidos:</strong> Datos que pasaron todas las validaciones y están listos para importar.
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center'
            }}>
              💡 <strong>Consejo:</strong> Si encuentras muchos errores, puedes regresar al paso anterior para 
              ajustar el mapeo de columnas o descargar una plantilla actualizada.
            </Typography>
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};