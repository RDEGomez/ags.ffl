// 🔥 COMPONENTE: Tarjeta de Estadísticas con Gráficas Radar - Estilo Gaming
import React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useImage } from '../hooks/useImage';
import { getCategoryName } from '../helpers/mappings';

// 🔥 COMPONENTE: Tarjeta de Estadísticas Radar Gaming Style
const TarjetaEstadisticasRadar = ({ estadisticasEquipo, equipo }) => {
  const equipoImageUrl = useImage(equipo?.imagen);
  const jugadorImageUrl = useImage(estadisticasEquipo?.jugador?.imagen);

  // 🔥 DATOS PARA GRÁFICA OFENSIVA - 8 EJES AGRUPADOS POR TIPO (CORREGIDO)
  const datosOfensivos = [
    // 📊 MÉTRICAS GENERALES (arriba)
    {
      estadistica: 'Puntos',
      valor: estadisticasEquipo?.puntos || 0,
      maximo: 50,
      label: `${estadisticasEquipo?.puntos || 0}`
    },
    {
      estadistica: 'QB Rating',
      valor: estadisticasEquipo?.qbRating || 0,
      maximo: 150,
      label: `${(estadisticasEquipo?.qbRating || 0).toFixed(1)}`
    },
    
    // 🎯 ESTADÍSTICAS DE PASE (lado izquierdo)
    {
      estadistica: 'Pases Comp.',
      valor: estadisticasEquipo?.pases?.completados || 0,
      maximo: 25,
      label: `${estadisticasEquipo?.pases?.completados || 0}`
    },
    {
      estadistica: 'Pases TD',
      valor: estadisticasEquipo?.pases?.touchdowns || 0,
      maximo: 10,
      label: `${estadisticasEquipo?.pases?.touchdowns || 0}`
    },
    {
      estadistica: 'Pases Conv.',
      valor: estadisticasEquipo?.pases?.conversiones || 0,
      maximo: 8,
      label: `${estadisticasEquipo?.pases?.conversiones || 0}`
    },
    
    // 🏈 ESTADÍSTICAS DE RECEPCIÓN (lado derecho)
    {
      estadistica: 'Recepciones',
      valor: estadisticasEquipo?.recepciones?.total || 0,
      maximo: 20,
      label: `${estadisticasEquipo?.recepciones?.total || 0}`
    },
    {
      estadistica: 'Rec. TD',
      valor: estadisticasEquipo?.recepciones?.touchdowns || 0,
      maximo: 8,
      label: `${estadisticasEquipo?.recepciones?.touchdowns || 0}`
    },
    {
      estadistica: 'Rec. Conv.',
      valor: (estadisticasEquipo?.recepciones?.conversiones1pt || 0) + (estadisticasEquipo?.recepciones?.conversiones2pt || 0),
      maximo: 8,
      label: `${(estadisticasEquipo?.recepciones?.conversiones1pt || 0) + (estadisticasEquipo?.recepciones?.conversiones2pt || 0)}`
    }
  ];

  // 🔥 DATOS PARA GRÁFICA DEFENSIVA - CORREGIDO
  const datosDefensivos = [
    {
      estadistica: 'Tackleos',
      valor: estadisticasEquipo?.tackleos || 0,
      maximo: 20,
      label: `${estadisticasEquipo?.tackleos || 0}`
    },
    {
      estadistica: 'Intercepciones',
      valor: estadisticasEquipo?.intercepciones || 0,
      maximo: 8,
      label: `${estadisticasEquipo?.intercepciones || 0}`
    },
    {
      estadistica: 'Sacks',
      valor: estadisticasEquipo?.sacks || 0,
      maximo: 10,
      label: `${estadisticasEquipo?.sacks || 0}`
    }
  ];

  // 🔥 NORMALIZAR DATOS PARA EL RADAR (0-100)
  const normalizarDatos = (datos) => {
    return datos.map(item => ({
      ...item,
      valorNormalizado: Math.min((item.valor / item.maximo) * 100, 100)
    }));
  };

  const datosOfensivosNormalizados = normalizarDatos(datosOfensivos);
  const datosDefensivosNormalizados = normalizarDatos(datosDefensivos);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 25%, #243447 50%, #1a2332 75%, #0f1419 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(64, 181, 246, 0.2)',
          borderRadius: 3,
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          mb: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          '&:hover': {
            border: '1px solid rgba(64, 181, 246, 0.4)',
            boxShadow: '0 12px 40px rgba(64, 181, 246, 0.1)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        {/* 🎨 EFECTOS DE FONDO */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 10% 10%, rgba(64, 181, 246, 0.1) 0%, transparent 30%),
              radial-gradient(circle at 90% 90%, rgba(156, 39, 176, 0.1) 0%, transparent 30%),
              linear-gradient(45deg, transparent 48%, rgba(64, 181, 246, 0.05) 50%, transparent 52%)
            `,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* 🏆 LOGO DEL EQUIPO COMO MARCA DE AGUA */}
        {equipoImageUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 200,
              height: 200,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: 0.15,
              zIndex: 0,
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          >
            <img
              src={equipoImageUrl}
              alt={equipo?.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}

        {/* 🎯 HEADER - JUGADOR INFO */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 3, 
          mb: 4,
          zIndex: 1,
          position: 'relative'
        }}>
          {/* Avatar del Jugador */}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Avatar
              src={jugadorImageUrl}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid rgba(64, 181, 246, 0.6)',
                boxShadow: '0 0 20px rgba(64, 181, 246, 0.4)',
                background: 'linear-gradient(135deg, rgba(64, 181, 246, 0.2), rgba(156, 39, 176, 0.2))',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {estadisticasEquipo?.jugador?.nombre?.charAt(0) || equipo?.nombre?.charAt(0)}
            </Avatar>
          </motion.div>

          {/* Info del Jugador */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white', 
                fontWeight: 700,
                mb: 0.5,
                background: 'linear-gradient(45deg, #64b5f6, #9c27b0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              {estadisticasEquipo?.jugador?.nombre || 'Jugador'}
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                mb: 1,
                fontSize: '1.1rem'
              }}
            >
              {equipo?.nombre}
            </Typography>

            {/* Chips de info */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`#${estadisticasEquipo?.numero || '??'}`}
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  color: '#ffc107',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}
              />
              <Chip
                label={getCategoryName(equipo?.categoria)}
                sx={{
                  backgroundColor: 'rgba(64, 181, 246, 0.2)',
                  color: '#40b5f6',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  border: '1px solid rgba(64, 181, 246, 0.3)'
                }}
              />
              <Chip
                label={`${estadisticasEquipo?.puntos || 0} PTS`}
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  color: '#4caf50',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* 📊 GRÁFICAS RADAR */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 4,
          zIndex: 1,
          position: 'relative'
        }}>
          
          {/* 🔥 GRÁFICA OFENSIVA */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#ff6b35', 
                fontWeight: 700,
                mb: 2,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              🔥 Estadísticas Ofensivas
            </Typography>
            
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={datosOfensivosNormalizados}>
                  <PolarGrid 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth={1}
                  />
                  <PolarAngleAxis 
                    dataKey="estadistica" 
                    tick={{ 
                      fill: 'rgba(255,255,255,0.8)', 
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ 
                      fill: 'rgba(255,255,255,0.5)', 
                      fontSize: 9 
                    }}
                  />
                  <Radar
                    name="Ofensivas"
                    dataKey="valorNormalizado"
                    stroke="#ff6b35"
                    fill="rgba(255, 107, 53, 0.3)"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    dot={{ 
                      fill: '#ff6b35', 
                      strokeWidth: 2, 
                      r: 3 
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>

            {/* Valores reales */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              justifyContent: 'center',
              mt: 2
            }}>
              {datosOfensivos.map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.estadistica}: ${item.label}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 107, 53, 0.2)',
                    color: '#ff6b35',
                    fontSize: '0.7rem',
                    border: '1px solid rgba(255, 107, 53, 0.3)'
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* 🛡️ GRÁFICA DEFENSIVA */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#4caf50', 
                fontWeight: 700,
                mb: 2,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 1
              }}
            >
              🛡️ Estadísticas Defensivas
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={datosDefensivosNormalizados}>
                  <PolarGrid 
                    stroke="rgba(255,255,255,0.2)" 
                    strokeWidth={1}
                  />
                  <PolarAngleAxis 
                    dataKey="estadistica" 
                    tick={{ 
                      fill: 'rgba(255,255,255,0.8)', 
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ 
                      fill: 'rgba(255,255,255,0.5)', 
                      fontSize: 10 
                    }}
                  />
                  <Radar
                    name="Defensivas"
                    dataKey="valorNormalizado"
                    stroke="#4caf50"
                    fill="rgba(76, 175, 80, 0.3)"
                    fillOpacity={0.6}
                    strokeWidth={3}
                    dot={{ 
                      fill: '#4caf50', 
                      strokeWidth: 2, 
                      r: 4 
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>

            {/* Valores reales */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              justifyContent: 'center',
              mt: 2
            }}>
              {datosDefensivos.map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.estadistica}: ${item.label}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    color: '#4caf50',
                    fontSize: '0.7rem',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* 📈 RESUMEN DE RENDIMIENTO */}
        <Box sx={{ 
          mt: 3, 
          pt: 3, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Partidos: {estadisticasEquipo?.partidosJugados || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Jugadas: {estadisticasEquipo?.totalJugadas || 0}
            </Typography>
            {estadisticasEquipo?.qbRating > 0 && (
              <Typography variant="body2" sx={{ color: '#ffd700' }}>
                QB Rating: {estadisticasEquipo.qbRating.toFixed(1)}
              </Typography>
            )}
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#4caf50',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}
          >
            Total: {estadisticasEquipo?.puntos || 0} PTS
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

export default TarjetaEstadisticasRadar;