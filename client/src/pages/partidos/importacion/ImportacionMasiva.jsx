// 📁 client/src/pages/partidos/ImportacionMasiva.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Breadcrumbs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// 🔥 Importar componentes modulares (los crearemos paso a paso)
import { TipoImportacion } from './TipoImportacion';
import { CargaArchivo } from './CargaArchivo';
import { MapeoColumnas } from './MapeoColumnas';
import { ValidacionDatos } from './ValidacionDatos';
import { ProcesoImportacion } from './ProcesoImportacion';

// 🎯 Pasos del wizard
const steps = [
  {
    key: 'tipo',
    label: 'Tipo de Importación',
    description: 'Selecciona qué datos vas a importar',
    icon: '🎯'
  },
  {
    key: 'archivo',
    label: 'Cargar Archivo',
    description: 'Sube tu archivo CSV',
    icon: '📁'
  },
  {
    key: 'mapeo',
    label: 'Mapear Columnas',
    description: 'Asocia las columnas con los campos',
    icon: '🔗'
  },
  {
    key: 'validacion',
    label: 'Validar Datos',
    description: 'Revisa que todo esté correcto',
    icon: '✅'
  },
  {
    key: 'importacion',
    label: 'Importar',
    description: 'Procesar los datos',
    icon: '🚀'
  }
];

export const ImportacionMasiva = () => {
  const navigate = useNavigate();
  
  // 🔥 Estado del wizard
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    tipo: '', // 'partidos' | 'jugadas'
    archivo: null,
    csvData: null,
    headers: [],
    mappings: {},
    validationResults: null,
    importacionResults: null
  });
  
  // 🔥 Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔄 Navegar entre pasos
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
      setError(''); // Limpiar errores al retroceder
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setWizardData({
      tipo: '',
      archivo: null,
      csvData: null,
      headers: [],
      mappings: {},
      validationResults: null,
      importacionResults: null
    });
    setError('');
  };

  // 🔥 Actualizar datos del wizard
  const updateWizardData = (updates) => {
    setWizardData(prev => 
      typeof updates === 'function'
        ? updates(prev)
        : { ...prev, ...updates }
    );
    setError('');
  };

  // 🎯 Validar si se puede avanzar al siguiente paso
  const canProceedToNext = () => {
    switch (activeStep) {
      case 0: // Tipo de importación
        return wizardData.tipo !== '';
      case 1: // Archivo
        return wizardData.archivo !== null && wizardData.csvData !== null;
      case 2: // Mapeo
        return Object.keys(wizardData.mappings).length > 0;
      case 3: // Validación
        return wizardData.validationResults !== null;
      case 4: // Importación
        return wizardData.importacionResults !== null;
      default:
        return false;
    }
  };

  // 🎨 Renderizar contenido del paso actual
  const renderStepContent = () => {
    const stepProps = {
      wizardData,
      updateWizardData,
      setLoading,
      setError,
      onNext: handleNext
    };

    switch (activeStep) {
      case 0:
        return <TipoImportacion {...stepProps} />;
      case 1:
        return <CargaArchivo {...stepProps} />;
      case 2:
        return <MapeoColumnas {...stepProps} />;
      case 3:
        return <ValidacionDatos {...stepProps} />;
      case 4:
        return <ProcesoImportacion {...stepProps} />;
      default:
        return null;
    }
  };

  // 🎯 Obtener información del paso actual
  const currentStepInfo = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  // 🎨 Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
    }
  };

  const descargarPlantilla = async (tipo) => {
    try {
      console.log(`🔄 Iniciando descarga de plantilla: ${tipo}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        return;
      }

      // Usar la URL base correcta
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const url = `${baseURL}/api/importacion/plantillas/${tipo}`;
      
      console.log(`📡 Descargando desde: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📊 Respuesta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      console.log(`📁 Archivo recibido: ${blob.size} bytes`);
      
      // Crear URL temporal para descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Crear elemento <a> temporal para descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `plantilla_${tipo}.csv`;
      link.style.display = 'none';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL temporal
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`✅ Descarga completada exitosamente`);
      
    } catch (error) {
      console.error('❌ Error en descarga:', error);
      setError(`Error al descargar plantilla: ${error.message}`);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, md: 4 },
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      minHeight: 'calc(100vh - 64px)',
      borderRadius: 2
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumbs */}
        <motion.div variants={itemVariants}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
          >
            <Typography 
              component="span" 
              sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
              onClick={() => navigate('/partidos')}
            >
              Partidos
            </Typography>
            <Typography color="primary">Importación Masiva</Typography>
          </Breadcrumbs>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <UploadIcon sx={{ color: '#64b5f6' }} />
              Importación Masiva
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Información del paso actual */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                backgroundColor: 'rgba(100, 181, 246, 0.1)',
                borderRadius: 2,
                px: 2,
                py: 1,
                border: '1px solid rgba(100, 181, 246, 0.2)'
              }}>
                <Typography variant="body2" sx={{ color: '#64b5f6' }}>
                  {currentStepInfo.icon} Paso {activeStep + 1} de {steps.length}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
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
                Volver
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* Stepper */}
        <motion.div variants={itemVariants}>
          <Card sx={{ ...cardStyle, mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{
                  '& .MuiStepLabel-label': { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-active': {
                      color: '#64b5f6'
                    },
                    '&.Mui-completed': {
                      color: '#4caf50'
                    }
                  }
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.key}>
                    <StepLabel>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {step.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {step.description}
                        </Typography>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error global */}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Contenido del paso actual */}
        <motion.div variants={itemVariants}>
          <Card sx={cardStyle}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              {/* Título del paso */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 4,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                pb: 2
              }}>
                <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                  {currentStepInfo.icon}
                </Typography>
                <Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {currentStepInfo.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {currentStepInfo.description}
                  </Typography>
                </Box>
              </Box>

              {/* Contenido dinámico del paso */}
              <Box sx={{ minHeight: '400px', mb: 4 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loading ? (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        minHeight: '300px',
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        <CircularProgress size={60} />
                        <Typography sx={{ color: 'white' }}>
                          Procesando...
                        </Typography>
                      </Box>
                    ) : (
                      renderStepContent()
                    )}
                  </motion.div>
                </AnimatePresence>
              </Box>

              {/* Controles de navegación */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pt: 3,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Button
                  disabled={isFirstStep || loading}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  Anterior
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Botón de reinicio */}
                  {activeStep > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      disabled={loading}
                      sx={{
                        borderColor: 'rgba(255, 152, 0, 0.3)',
                        color: 'rgba(255, 152, 0, 0.7)',
                        '&:hover': {
                          borderColor: 'rgba(255, 152, 0, 0.5)',
                          backgroundColor: 'rgba(255, 152, 0, 0.05)'
                        }
                      }}
                    >
                      Reiniciar
                    </Button>
                  )}

                  {/* Botón siguiente/finalizar */}
                  {!isLastStep ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceedToNext() || loading}
                      sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/partidos')}
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Finalizar
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ayuda contextual */}
        <motion.div variants={itemVariants}>
          <Card sx={{ ...cardStyle, mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2
              }}>
                <FileDownloadIcon sx={{ color: '#64b5f6' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  ¿Necesitas ayuda?
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                Si es tu primera vez importando datos, te recomendamos descargar las plantillas CSV 
                y seguir el formato exacto para evitar errores.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => descargarPlantilla(wizardData.tipo)}
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  );
};