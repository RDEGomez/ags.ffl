// 📁 client/src/pages/partidos/importacion/CargaArchivo.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export const CargaArchivo = ({ wizardData, updateWizardData, setLoading, setError, onNext }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Al inicio del archivo, después de los imports
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 🔄 Procesar archivo CSV
  const procesarArchivo = async (file) => {
    try {
      setLoading(true);
      setUploadProgress(20);

      // Leer archivo
      const fileContent = await leerArchivo(file);
      setUploadProgress(40);

      // Parsear CSV
      const csvData = await parsearCSV(fileContent);
      setUploadProgress(60);

      // Analizar estructura
      const analysis = analizarEstructura(csvData, file);
      setUploadProgress(80);

      // Actualizar wizard data
      updateWizardData({
        archivo: file,
        csvData: csvData.data,
        headers: csvData.meta.fields || Object.keys(csvData.data[0] || {}),
        analysisResult: analysis
      });

      setAnalysisResult(analysis);
      setUploadProgress(100);

      // Auto-avanzar si todo está correcto
      if (analysis.puedeImportar) {
        setTimeout(() => {
          onNext();
        }, 1500);
      }

    } catch (error) {
      console.error('Error procesando archivo:', error);
      setError(error.message || 'Error al procesar el archivo CSV');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // 📖 Leer archivo como texto
  const leerArchivo = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // 📊 Parsear CSV con Papa Parse
  const parsearCSV = (content) => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Errores de parsing CSV:', results.errors);
          }
          resolve(results);
        },
        error: (error) => reject(new Error(`Error al parsear CSV: ${error.message}`))
      });
    });
  };

  // 🔍 Analizar estructura del CSV
  const analizarEstructura = (csvData, file) => {
    const data = csvData.data;
    const headers = csvData.meta.fields || Object.keys(data[0] || {});

    // Campos esperados según tipo
    const camposEsperados = {
      partidos: [
        { key: 'equipo_local', required: true },
        { key: 'equipo_visitante', required: true },
        { key: 'torneo', required: true },
        { key: 'fecha_hora', required: true },
        { key: 'categoria', required: false },
        { key: 'sede_nombre', required: false },
        { key: 'arbitro_principal', required: false },
        { key: 'estado', required: false },
        { key: 'marcador_local', required: false },
        { key: 'marcador_visitante', required: false }
      ],
      jugadas: [
        { key: 'partido_id', required: true },
        { key: 'tipo_jugada', required: true },
        { key: 'equipo_posesion', required: true },
        { key: 'jugador_principal', required: true },
        { key: 'minuto', required: false },
        { key: 'segundo', required: false },
        { key: 'periodo', required: false },
        { key: 'jugador_secundario', required: false },
        { key: 'descripcion', required: false },
        { key: 'puntos', required: false }
      ]
    };

    const campos = camposEsperados[wizardData.tipo] || camposEsperados.partidos;
    const camposRequeridos = campos.filter(c => c.required).map(c => c.key);
    const camposFaltantes = camposRequeridos.filter(campo => !headers.includes(campo));
    const camposExtra = headers.filter(header => !campos.find(c => c.key === header));

    // Validaciones básicas
    const validaciones = [];
    
    if (data.length === 0) {
      validaciones.push({
        tipo: 'error',
        mensaje: 'El archivo no contiene datos válidos'
      });
    }

    if (camposFaltantes.length > 0) {
      validaciones.push({
        tipo: 'error',
        mensaje: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}`
      });
    }

    if (camposExtra.length > 0) {
      validaciones.push({
        tipo: 'warning',
        mensaje: `Campos adicionales encontrados: ${camposExtra.join(', ')} (serán ignorados)`
      });
    }

    // Validaciones específicas por tipo
    if (wizardData.tipo === 'partidos') {
      // Validar formato de fechas en primera fila
      if (data[0] && data[0].fecha_hora) {
        const fecha = new Date(data[0].fecha_hora);
        if (isNaN(fecha.getTime())) {
          validaciones.push({
            tipo: 'error',
            mensaje: 'Formato de fecha inválido. Use: YYYY-MM-DD HH:MM'
          });
        }
      }
    }

    const puedeImportar = validaciones.filter(v => v.tipo === 'error').length === 0 && data.length > 0;

    return {
      archivo: {
        nombre: file.name,
        tamaño: `${Math.round(file.size / 1024)}KB`,
        tipo: file.type
      },
      estructura: {
        filas: data.length,
        columnas: headers.length,
        headers: headers
      },
      validaciones,
      preview: data.slice(0, 5), // Primeras 5 filas
      puedeImportar,
      errores: validaciones.filter(v => v.tipo === 'error').length,
      warnings: validaciones.filter(v => v.tipo === 'warning').length
    };
  };

  // 🎯 Configuración del dropzone
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('El archivo es demasiado grande. Máximo permitido: 10MB');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Tipo de archivo no válido. Solo se aceptan archivos CSV (.csv)');
      } else {
        setError('Error al cargar el archivo');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      procesarArchivo(file);
    }
  }, [wizardData.tipo]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'text/plain': ['.csv', '.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // 🗑️ Limpiar archivo
  const limpiarArchivo = () => {
    updateWizardData({
      archivo: null,
      csvData: null,
      headers: [],
      analysisResult: null
    });
    setAnalysisResult(null);
  };

  // 📊 Renderizar tabla de preview
  const renderPreviewTable = () => {
    if (!analysisResult || !analysisResult.preview.length) return null;

    const preview = analysisResult.preview;
    const headers = analysisResult.estructura.headers;

    return (
      <TableContainer component={Paper} sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        maxHeight: 300
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell 
                  key={index}
                  sx={{ 
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    color: '#64b5f6',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {preview.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, colIndex) => (
                  <TableCell 
                    key={colIndex}
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      whiteSpace: 'nowrap',
                      maxWidth: 150,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {row[header] !== null && row[header] !== undefined 
                      ? String(row[header]) 
                      : '—'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      {/* Zona de carga de archivo */}
      {!wizardData.archivo ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            {...getRootProps()}
            sx={{
              p: 6,
              textAlign: 'center',
              border: isDragActive 
                ? '3px dashed #64b5f6' 
                : '2px dashed rgba(255, 255, 255, 0.3)',
              borderRadius: 3,
              backgroundColor: isDragActive 
                ? 'rgba(100, 181, 246, 0.1)' 
                : 'rgba(255, 255, 255, 0.03)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(100, 181, 246, 0.05)',
                border: '2px dashed #64b5f6',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <input {...getInputProps()} />
            
            <CloudUploadIcon sx={{ 
              fontSize: 80, 
              color: isDragActive ? '#64b5f6' : 'rgba(255, 255, 255, 0.5)',
              mb: 2 
            }} />
            
            <Typography variant="h5" sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              mb: 2 
            }}>
              {isDragActive 
                ? '¡Suelta el archivo aquí!' 
                : 'Arrastra tu archivo CSV aquí'
              }
            </Typography>
            
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 3 
            }}>
              O haz clic para seleccionar un archivo
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label="CSV" 
                color="primary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label="Máx 10MB" 
                color="secondary" 
                variant="outlined" 
                size="small" 
              />
              <Chip 
                label="UTF-8" 
                color="success" 
                variant="outlined" 
                size="small" 
              />
            </Box>

            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.5)' 
            }}>
              Formato recomendado: CSV con encabezados en la primera fila
            </Typography>
          </Paper>

          {/* Plantillas de descarga */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              mb: 2 
            }}>
              ¿Primera vez? Descarga una plantilla de ejemplo:
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              href={`/api/importacion/plantillas/${wizardData.tipo}`}
              download
              sx={{
                borderColor: 'rgba(76, 175, 80, 0.3)',
                color: '#4caf50',
                '&:hover': {
                  borderColor: 'rgba(76, 175, 80, 0.5)',
                  backgroundColor: 'rgba(76, 175, 80, 0.05)'
                }
              }}
            >
              Plantilla {wizardData.tipo === 'partidos' ? 'Partidos' : 'Jugadas'}
            </Button>
          </Box>
        </motion.div>
      ) : (
        /* Archivo cargado - Mostrar análisis */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Barra de progreso */}
          <AnimatePresence>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                    Procesando archivo... {uploadProgress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress}
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

          {/* Información del archivo */}
          {analysisResult && (
            <Paper sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              p: 3,
              mb: 3
            }}>
              {/* Header del archivo */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DescriptionIcon sx={{ color: '#64b5f6', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {analysisResult.archivo.nombre}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {analysisResult.archivo.tamaño} • {analysisResult.estructura.filas} filas • {analysisResult.estructura.columnas} columnas
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => procesarArchivo(wizardData.archivo)}
                    disabled={uploadProgress > 0}
                    sx={{ color: '#64b5f6' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                  <IconButton
                    onClick={limpiarArchivo}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Estadísticas del análisis */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: analysisResult.puedeImportar ? '#4caf50' : '#f44336',
                      fontWeight: 'bold' 
                    }}>
                      {analysisResult.puedeImportar ? '✓' : '✗'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Estado
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                      {analysisResult.estructura.filas}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Filas
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: analysisResult.errores > 0 ? '#f44336' : '#4caf50',
                      fontWeight: 'bold' 
                    }}>
                      {analysisResult.errores}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Errores
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ 
                      color: analysisResult.warnings > 0 ? '#ff9800' : '#9e9e9e',
                      fontWeight: 'bold' 
                    }}>
                      {analysisResult.warnings}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Advertencias
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Validaciones */}
              {analysisResult.validaciones.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {analysisResult.validaciones.map((validacion, index) => (
                    <Alert 
                      key={index}
                      severity={validacion.tipo === 'error' ? 'error' : 'warning'}
                      sx={{ mb: 1 }}
                    >
                      {validacion.mensaje}
                    </Alert>
                  ))}
                </Box>
              )}

              {/* Preview de datos */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Vista Previa de Datos
                  </Typography>
                  <IconButton
                    onClick={() => setPreviewExpanded(!previewExpanded)}
                    sx={{ color: 'white' }}
                  >
                    {previewExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Collapse in={previewExpanded}>
                  {renderPreviewTable()}
                </Collapse>

                {!previewExpanded && (
                  <Typography variant="body2" sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center',
                    py: 2
                  }}>
                    Haz clic para expandir y ver las primeras 5 filas de datos
                  </Typography>
                )}
              </Box>

              {/* Botón de continuar */}
              {analysisResult.puedeImportar && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onNext}
                      startIcon={<CheckCircleIcon />}
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Archivo Válido - Continuar
                    </Button>
                  </Box>
                </motion.div>
              )}
            </Paper>
          )}
        </motion.div>
      )}
    </Box>
  );
};