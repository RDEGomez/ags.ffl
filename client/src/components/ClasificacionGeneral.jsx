// 📁 src/components/ClasificacionGeneral.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  EmojiEvents,
  Security as SecurityIcon
} from '@mui/icons-material';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import SportsHandballIcon from '@mui/icons-material/SportsHandball';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import { motion } from 'framer-motion';
import axiosInstance from '../config/axios';
import { useImage } from '../hooks/useImage';

// 🎯 TIPOS DE ESTADÍSTICAS DISPONIBLES - 🔥 CON SACKS INCLUIDO
const tiposEstadisticas = ['puntos', 'qbrating', 'recepciones', 'tackleos', 'intercepciones', 'sacks'];

// 🎨 CONFIGURACIÓN DE TIPOS - 🔥 CON SACKS AGREGADO
const CONFIGURACION_TIPOS = {
  puntos: {
    icono: <ScoreboardIcon />,
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.05)',
    gradient: "linear-gradient(145deg, #ffd700, #ffed4e)",
    titulo: "Rey de Puntos",
    label: "Puntos Totales"
  },
  qbrating: {
    icono: <SportsHandballIcon />,
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.05)',
    gradient: "linear-gradient(145deg, #2196f3, #64b5f6)",
    titulo: "Maestro QB",
    label: "QB Rating"
  },
  tackleos: {
    icono: <SecurityIcon />,
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.05)',
    gradient: "linear-gradient(145deg, #9c27b0, #ba68c8)",
    titulo: "Muro Defensivo",
    label: "Tackleos"
  },
  intercepciones: {
    icono: <TransferWithinAStationIcon />,
    color: '#e91e63',
    bgColor: 'rgba(233, 30, 99, 0.05)',
    gradient: "linear-gradient(145deg, #e91e63, #f48fb1)",
    titulo: "Interceptor",
    label: "Intercepciones"
  },
  recepciones: {
    icono: <WavingHandIcon />,
    color: '#f57c00',
    bgColor: 'rgba(245, 124, 0, 0.05)',
    gradient: "linear-gradient(145deg, #f57c00, #ffb74d)",
    titulo: "Manos Seguras",
    label: "Recepciones"
  },
  // 🔥 NUEVA CONFIGURACIÓN PARA SACKS
  sacks: {
    icono: <SportsKabaddiIcon />,
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.05)',
    gradient: "linear-gradient(145deg, #f44336, #ef5350)",
    titulo: "Cazador de QBs",
    label: "Sacks"
  }
};

// 🎨 FUNCIÓN HELPER PARA OBTENER COLOR DEL QB RATING
const obtenerColorQBRating = (rating) => {
  if (rating >= 130) return '#4caf50'; // Verde - Excelente
  if (rating >= 110) return '#2196f3'; // Azul - Muy bueno
  if (rating >= 90) return '#ff9800';  // Naranja - Bueno
  if (rating >= 70) return '#ffeb3b';  // Amarillo - Regular
  return '#f44336'; // Rojo - Malo
};

// 🔥 COMPONENTE: TARJETA INDIVIDUAL DE LÍDER CON TOP 5
const TarjetaClasificacion = ({ tipo, lideresData, loading }) => {
  const config = CONFIGURACION_TIPOS[tipo];
  const lideres = lideresData?.lideres || [];
  const lider = lideres[0];
  const restantes = lideres.slice(1, 5); // Posiciones 2-5

  if (loading) {
    return (
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '600px', // Altura aumentada aún más para TOP 5
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: config.color }} />
      </Box>
    );
  }

  if (!lider) {
    return (
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '600px', // Altura aumentada aún más
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ color: config.color, mb: 2, opacity: 0.5 }}>
          {config.icono}
        </Box>
        <Typography variant="h6" sx={{ color: config.color, fontWeight: 700, mb: 1 }}>
          {config.titulo}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Sin estadísticas registradas
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <Box
        sx={{
          background: `linear-gradient(145deg, ${config.color}20, ${config.color}10)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${config.color}30`,
          borderRadius: 3,
          p: 3,
          height: '600px', // Altura aumentada aún más para TOP 5
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'relative' // 🔥 POSICIÓN RELATIVA PARA LA IMAGEN DEL EQUIPO
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, position: 'relative', zIndex: 2 }}>
          <Box sx={{ color: config.color }}>
            {config.icono}
          </Box>
          <Typography variant="h6" sx={{ color: config.color, fontWeight: 700 }}>
            {config.titulo}
          </Typography>
        </Box>

        {/* Líder Principal */}
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <LiderPrincipal lider={lider} tipo={tipo} config={config} />
        </Box>

        {/* Separador */}
        <Box
          sx={{
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${config.color}40, transparent)`,
            my: 2,
            position: 'relative',
            zIndex: 2
          }}
        />

        {/* Top 2-5 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, position: 'relative', zIndex: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              mb: 1
            }}
          >
            TOP 2-5
          </Typography>
          
          {restantes.length > 0 ? (
            restantes.map((jugador, index) => (
              <LiderSecundario
                key={`${tipo}-${jugador.jugador?._id}-${index}`}
                lider={jugador}
                posicion={index + 2}
                tipo={tipo}
                color={config.color}
              />
            ))
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontStyle: 'italic',
                textAlign: 'center'
              }}
            >
              Solo hay un líder registrado
            </Typography>
          )}
        </Box>

        {/* 🔥 IMAGEN DEL EQUIPO COMO MARCA DE AGUA */}
        {lider.equipo?.imagen && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity: 0.15, // Opacidad reducida para marca de agua
              zIndex: 0, // Detrás de los elementos
              border: `1px solid ${config.color}30`
            }}
          >
            <img
              src={lider.equipo.imagen}
              alt={lider.equipo.nombre}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

// 🏆 COMPONENTE: LÍDER PRINCIPAL - 🔥 USANDO URL DIRECTA TEMPORALMENTE
const LiderPrincipal = ({ lider, tipo, config }) => {
  // 🔥 Temporalmente usar la URL directa mientras investigamos el hook
  const imageUrl = lider.jugador?.imagen;

  return (
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      {/* Avatar del líder */}
      <Avatar
        src={imageUrl}
        sx={{
          width: 60,
          height: 60,
          margin: '0 auto 12px',
          border: `3px solid ${config.color}`,
          boxShadow: `0 4px 12px ${config.color}40`
        }}
      >
        {lider.jugador?.nombre?.charAt(0)}
      </Avatar>

      {/* Nombre y número */}
      <Typography
        variant="subtitle1"
        sx={{
          color: 'white',
          fontWeight: 700,
          mb: 0.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {lider.jugador?.nombre}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.7)',
          display: 'block',
          mb: 1
        }}
      >
        #{lider.jugador?.numero} • {lider.equipo?.nombre}
      </Typography>

      {/* Valor principal */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography
          variant="h4"
          sx={{
            color: config.color,
            fontWeight: 'bold'
          }}
        >
          {tipo === 'qbrating' ? Number(lider.valor).toFixed(1) : lider.valor}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 600
          }}
        >
          {config.label}
        </Typography>
      </Box>

      {/* QB Rating Color Bar */}
      {tipo === 'qbrating' && (
        <Box
          sx={{
            width: '60%',
            height: 4,
            background: obtenerColorQBRating(lider.valor),
            borderRadius: 2,
            margin: '8px auto 0',
            boxShadow: `0 2px 8px ${obtenerColorQBRating(lider.valor)}40`
          }}
        />
      )}
    </Box>
  );
};

// 🥈 COMPONENTE: LÍDERES SECUNDARIOS (2-5) - 🔥 USANDO URL DIRECTA TEMPORALMENTE
const LiderSecundario = ({ lider, posicion, tipo, color }) => {
  // 🔥 Temporalmente usar la URL directa mientras investigamos el hook
  const imageUrl = lider.jugador?.imagen;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 0.5,
        px: 1,
        borderRadius: 1,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 3 // Asegurar que esté por encima de la marca de agua
      }}
    >
      {/* Posición */}
      <Chip
        label={posicion}
        size="small"
        sx={{
          bgcolor: color,
          color: 'black',
          fontWeight: 700,
          minWidth: 24,
          height: 20,
          fontSize: '0.7rem'
        }}
      />

      {/* Avatar pequeño */}
      <Avatar
        src={imageUrl}
        sx={{
          width: 24,
          height: 24,
          border: `1px solid ${color}60`
        }}
      >
        {lider.jugador?.nombre?.charAt(0)}
      </Avatar>

      {/* Información del jugador */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {lider.jugador?.nombre || 'Jugador'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.65rem',
            display: 'block'
          }}
        >
          #{lider.jugador?.numero || '?'}
        </Typography>
      </Box>

      {/* Valor */}
      <Typography
        variant="caption"
        sx={{
          color,
          fontWeight: 700,
          fontSize: '0.7rem'
        }}
      >
        {tipo === 'qbrating' ? Number(lider.valor).toFixed(1) : lider.valor}
      </Typography>
    </Box>
  );
};

// 🏆 COMPONENTE PRINCIPAL
const ClasificacionGeneral = ({ torneoId, categoria }) => {
  const [clasificacion, setClasificacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 Cargar clasificación general
  useEffect(() => {
    const cargarClasificacion = async () => {
      if (!torneoId || !categoria) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🏆 Cargando clasificación general:', { torneoId, categoria });
        
        const response = await axiosInstance.get(`/estadisticas/clasificacion-general/${torneoId}/${categoria}`);
        
        console.log('✅ Clasificación general cargada:', response.data);
        
        setClasificacion(response.data.clasificacionGeneral);
        
      } catch (err) {
        console.error('❌ Error al cargar clasificación:', err);
        setError('Error al cargar la clasificación general');
      } finally {
        setLoading(false);
      }
    };

    cargarClasificacion();
  }, [torneoId, categoria]);

  // 🔄 Loading state
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        py: 8 
      }}>
        <CircularProgress sx={{ color: '#64b5f6' }} />
      </Box>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  // 📝 Empty state
  if (!clasificacion || Object.keys(clasificacion).length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <EmojiEvents sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          No hay datos disponibles
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Aún no se han registrado estadísticas para este torneo
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 0, pb: 4 }}> {/* 🔥 SIN PADDING TOP PARA ALINEACIÓN PERFECTA */}
      {/* Grid de tarjetas - 🔥 SIN HEADER PARA ALINEACIÓN CON TABLA */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 3,
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        {tiposEstadisticas.map((tipo) => (
          <TarjetaClasificacion
            key={tipo}
            tipo={tipo}
            lideresData={clasificacion[tipo]}
            loading={loading}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ClasificacionGeneral;