// 📁 client/src/components/EstadisticasIndividuales.jsx - NUEVOS COMPONENTES

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import {
  Sports,
  EmojiEvents,
  Shield,
  Bolt,
  PanTool,
  SportsFootball,
  Star,
  AutoAwesome
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// 🔥 FUNCIÓN HELPER PARA IMÁGENES (reutilizada)
const getImageUrl = (imagen) => {
  if (!imagen) return '';
  if (typeof imagen !== 'string') return '';
  
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }
  
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';
  return `${API_URL}/uploads/${imagen}`;
};

// 🎨 CONFIGURACIÓN DE ICONOS Y COLORES POR TIPO
const CONFIGURACION_TIPOS = {
  pases: {
    icono: <Sports />,
    titulo: "MAESTRO DEL PASE",
    color: "#64b5f6",
    gradient: "linear-gradient(145deg, #1976d2, #42a5f5)",
    label: "Pases Completados"
  },
  puntos: {
    icono: <EmojiEvents />,
    titulo: "REY DE PUNTOS", 
    color: "#ffd700",
    gradient: "linear-gradient(145deg, #f57c00, #ffb74d)",
    label: "Puntos Totales"
  },
  tackleos: {
    icono: <Shield />,
    titulo: "MURO DEFENSIVO",
    color: "#4caf50", 
    gradient: "linear-gradient(145deg, #388e3c, #66bb6a)",
    label: "Tackleos Exitosos"
  },
  intercepciones: {
    icono: <PanTool />,
    titulo: "CAZADOR DE PASES",
    color: "#ff5722",
    gradient: "linear-gradient(145deg, #d84315, #ff7043)", 
    label: "Intercepciones"
  },
  sacks: {
    icono: <Bolt />,
    titulo: "DEMOLEDOR QB",
    color: "#9c27b0",
    gradient: "linear-gradient(145deg, #7b1fa2, #ba68c8)",
    label: "Sacks Realizados"
  },
  recepciones: {
    icono: <SportsFootball />,
    titulo: "MANOS SEGURAS",
    color: "#ff9800",
    gradient: "linear-gradient(145deg, #f57c00, #ffb74d)",
    label: "Recepciones"
  }
};

// 🔥 COMPONENTE: TARJETA DE LÍDER INDIVIDUAL CON TOP 3
export const TarjetaLiderIndividual = ({ tipo, lideresData }) => {
  const config = CONFIGURACION_TIPOS[tipo];
  const lideres = lideresData?.lideres || [];
  const lider = lideres[0]; // Primer lugar
  const segundoLugar = lideres[1]; // Segundo lugar  
  const tercerLugar = lideres[2]; // Tercer lugar

  if (!lider) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            background: `linear-gradient(145deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3))`,
            backdropFilter: 'blur(25px)',
            border: `1px solid ${config.color}40`,
            borderRadius: '20px',
            p: 3,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center'
          }}>
            Sin datos disponibles
          </Typography>
        </Box>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 300 }}
      whileHover={{ scale: 1.02, rotateY: 2 }}
    >
      <Box
        sx={{
          background: config.gradient,
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 3,
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {React.cloneElement(config.icono, { 
                sx: { 
                  color: 'white', 
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))'
                } 
              })}
            </motion.div>
            <Typography variant="h6" sx={{ 
              color: 'white',
              fontWeight: 900,
              fontSize: '1.1rem',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              {config.titulo}
            </Typography>
          </Box>
          
          <Chip
            label={config.label}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          />
        </Box>

        {/* Línea divisoria */}
        <Divider sx={{ 
          borderColor: 'rgba(255, 255, 255, 0.3)', 
          mb: 2
        }} />

        {/* Líder Principal */}
        <Box sx={{ 
          p: 3,
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Avatar del líder */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Avatar
              src={getImageUrl(lider.jugador.avatar)}
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                border: '4px solid white',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              }}
            >
              {lider.jugador.nombre?.charAt(0)}
            </Avatar>
          </motion.div>

          {/* Nombre y número */}
          <Typography variant="h6" sx={{ 
            color: 'white',
            fontWeight: 900,
            mb: 0.5,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            {lider.jugador.nombre}
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            mb: 2
          }}>
            #{lider.jugador.numero} • {lider.equipo.nombre}
          </Typography>

          {/* Valor principal */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Typography variant="h3" sx={{ 
              color: 'white',
              fontWeight: 900,
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
              mb: 1
            }}>
              {lider.valor}
            </Typography>
          </motion.div>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Star sx={{ color: '#ffd700', fontSize: '1.2rem' }} />
            </motion.div>
            <Typography variant="caption" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              Líder Absoluto
            </Typography>
          </Box>
        </Box>

        {/* Tabla de Top 3 */}
        {(segundoLugar || tercerLugar) && (
          <Box sx={{ 
            background: 'rgba(0, 0, 0, 0.2)',
            p: 2
          }}>
            <Typography variant="subtitle2" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 700,
              mb: 1,
              textAlign: 'center'
            }}>
              TOP 3
            </Typography>
            
            <TableContainer component={Paper} sx={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <Table size="small">
                <TableBody>
                  {[segundoLugar, tercerLugar].filter(Boolean).map((jugador, index) => (
                    <TableRow key={jugador.jugador._id}>
                      <TableCell sx={{ 
                        color: 'white', 
                        border: 'none',
                        py: 1,
                        fontSize: '0.8rem'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={getImageUrl(jugador.jugador.avatar)}
                            sx={{ width: 24, height: 24 }}
                          >
                            {jugador.jugador.nombre?.charAt(0)}
                          </Avatar>
                          <Avatar
                            src={getImageUrl(jugador.equipo.imagen)}
                            sx={{ width: 20, height: 20 }}
                          >
                            {jugador.equipo.nombre?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ 
                              color: 'white',
                              fontWeight: 600,
                              display: 'block',
                              lineHeight: 1
                            }}>
                              #{jugador.jugador.numero}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.6rem'
                            }}>
                              {jugador.jugador.nombre}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'white',
                        border: 'none',
                        textAlign: 'right',
                        py: 1
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 900,
                          color: '#ffd700'
                        }}>
                          {jugador.valor}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// 🔥 COMPONENTE: SECCIÓN COMPLETA DE ESTADÍSTICAS INDIVIDUALES
export const SeccionEstadisticasIndividuales = ({ lideresIndividuales }) => {
  const tiposDisponibles = ['pases', 'puntos', 'tackleos', 'intercepciones', 'sacks', 'recepciones'];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Box sx={{ mt: 6 }}>
        {/* Header de la sección */}
        <Box sx={{ 
          mb: 4,
          textAlign: 'center'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              mb: 2
            }}>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <AutoAwesome sx={{ 
                  color: '#ffd700', 
                  fontSize: '3rem',
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                }} />
              </motion.div>
              
              <Typography 
                variant="h3" 
                component="h2"
                sx={{ 
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #ffd700, #ffab00)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}
              >
                Estadísticas Individuales
              </Typography>
            </Box>
          </motion.div>
          
          <Typography variant="h6" sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 500,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            Los mejores jugadores en cada categoría de todos los equipos
          </Typography>
        </Box>

        {/* Grid de tarjetas */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 4,
          maxWidth: '1400px',
          mx: 'auto'
        }}>
          {tiposDisponibles.map((tipo) => (
            <TarjetaLiderIndividual
              key={tipo}
              tipo={tipo}
              lideresData={lideresIndividuales[tipo]}
            />
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};