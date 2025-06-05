import { motion } from 'framer-motion';
import { Box, Typography, Paper } from '@mui/material';
import {
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const EstadoPartido = ({ estado, variant = 'detallado' }) => {
  const getEstadoConfig = (estado) => {
    switch(estado) {
      case 'programado':
        return { 
          color: '#2196f3', 
          icon: <ScheduleIcon />, 
          label: 'Programado',
          bgColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: 'rgba(33, 150, 243, 0.3)',
          descripcion: 'El partido está programado y esperando su inicio'
        };
      case 'en_curso':
        return { 
          color: '#4caf50', 
          icon: <PlayArrowIcon />, 
          label: 'En Curso',
          bgColor: 'rgba(76, 175, 80, 0.1)',
          borderColor: 'rgba(76, 175, 80, 0.3)',
          pulso: true,
          descripcion: 'El partido está siendo jugado en este momento'
        };
      case 'medio_tiempo':
        return { 
          color: '#ff9800', 
          icon: <PauseIcon />, 
          label: 'Medio Tiempo',
          bgColor: 'rgba(255, 152, 0, 0.1)',
          borderColor: 'rgba(255, 152, 0, 0.3)',
          descripcion: 'El partido está en descanso de medio tiempo'
        };
      case 'finalizado':
        return { 
          color: '#9e9e9e', 
          icon: <CheckCircleIcon />, 
          label: 'Finalizado',
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: 'rgba(158, 158, 158, 0.3)',
          descripcion: 'El partido ha concluido'
        };
      case 'suspendido':
        return { 
          color: '#f44336', 
          icon: <PauseIcon />, 
          label: 'Suspendido',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)',
          descripcion: 'El partido fue suspendido temporalmente'
        };
      case 'cancelado':
        return { 
          color: '#f44336', 
          icon: <CancelIcon />, 
          label: 'Cancelado',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          borderColor: 'rgba(244, 67, 54, 0.3)',
          descripcion: 'El partido fue cancelado'
        };
      default:
        return { 
          color: '#9e9e9e', 
          icon: <ScheduleIcon />, 
          label: 'Desconocido',
          bgColor: 'rgba(158, 158, 158, 0.1)',
          borderColor: 'rgba(158, 158, 158, 0.3)',
          descripcion: 'Estado desconocido'
        };
    }
  };

  const config = getEstadoConfig(estado);

  // Variante compacta para tarjetas de partido
  if (variant === 'compacto') {
    return (
      <motion.div
        animate={config.pulso ? { scale: [1, 1.05, 1] } : {}}
        transition={config.pulso ? { duration: 2, repeat: Infinity } : {}}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: config.bgColor,
            border: `1px solid ${config.borderColor}`,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          <Box sx={{ color: config.color, display: 'flex' }}>
            {config.icon}
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: config.color, 
              fontWeight: 'bold' 
            }}
          >
            {config.label}
          </Typography>
        </Box>
      </motion.div>
    );
  }

  // Variante detallada para vista completa
  return (
    <motion.div
      animate={config.pulso ? { scale: [1, 1.05, 1] } : {}}
      transition={config.pulso ? { duration: 2, repeat: Infinity } : {}}
    >
      <Paper
        sx={{
          backgroundColor: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          borderRadius: 3,
          p: 3,
          textAlign: 'center',
          height: '100%'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2 
        }}>
          <Box
            sx={{
              p: 2,
              borderRadius: '50%',
              backgroundColor: config.color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {config.icon}
          </Box>
          
          <Typography 
            variant="h5" 
            sx={{ 
              color: config.color, 
              fontWeight: 'bold' 
            }}
          >
            {config.label}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              maxWidth: 200
            }}
          >
            {config.descripcion}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default EstadoPartido;