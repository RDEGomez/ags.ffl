import React from 'react';
import { Box, Avatar, Typography, Tooltip, Chip } from '@mui/material';
import { Star as StarIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import { useLideresPartido } from '../../hooks/useLideresPartido';
import { useImage } from '../../hooks/useImage';

// 🏆 Componente compacto para mostrar líderes en tarjetas o vistas pequeñas
export const LideresPartidoCompacto = ({ 
  partidoId, 
  maxLideres = 3,
  mostrarSolo = ['puntos'], // Solo mostrar categorías específicas
  size = 'small' // 'small' | 'medium'
}) => {
  const { lideres, loading, error } = useLideresPartido(partidoId);

  // 🚫 No mostrar si está cargando, hay error o no hay datos
  if (loading || error || !lideres) return null;

  // 🎯 Filtrar y obtener líderes principales
  const lideresParaMostrar = mostrarSolo
    .map(categoria => ({
      categoria,
      lider: lideres[categoria]?.[0] // Solo el primer lugar
    }))
    .filter(item => item.lider); // Solo categorías con líderes

  if (lideresParaMostrar.length === 0) return null;

  const avatarSize = size === 'small' ? 24 : 32;
  const fontSize = size === 'small' ? '0.7rem' : '0.8rem';

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      flexWrap: 'wrap'
    }}>
      {/* 🏆 Icono indicador */}
      <TrophyIcon sx={{ 
        color: '#ffd700', 
        fontSize: size === 'small' ? 16 : 20 
      }} />

      {/* 👥 Líderes */}
      {lideresParaMostrar.slice(0, maxLideres).map(({ categoria, lider }, index) => {
        const jugadorImageUrl = useImage(lider.jugador?.imagen);
        
        return (
          <Tooltip
            key={`${categoria}-${lider.jugador?._id}`}
            title={`${lider.jugador?.nombre} • ${categoria}: ${
              categoria === 'qbrating' ? lider.valor.toFixed(1) : lider.valor
            }`}
            arrow
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              borderRadius: 1,
              p: 0.5,
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}>
              <Avatar
                src={jugadorImageUrl}
                sx={{
                  width: avatarSize,
                  height: avatarSize,
                  fontSize: '0.6rem',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid #ffd700'
                }}
              >
                #{lider.jugador?.numero || '?'}
              </Avatar>
              
              <Typography
                variant="caption"
                sx={{
                  color: '#ffd700',
                  fontWeight: 'bold',
                  fontSize
                }}
              >
                {categoria === 'qbrating' ? lider.valor.toFixed(1) : lider.valor}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}

      {/* 📊 Indicador de más líderes */}
      {lideresParaMostrar.length > maxLideres && (
        <Chip
          label={`+${lideresParaMostrar.length - maxLideres}`}
          size="small"
          sx={{
            height: size === 'small' ? 20 : 24,
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            color: '#ffd700',
            fontSize: size === 'small' ? '0.6rem' : '0.7rem',
            '& .MuiChip-label': {
              px: 1
            }
          }}
        />
      )}
    </Box>
  );
};

// 🎯 Versión aún más minimalista - Solo avatares
export const LideresPartidoMini = ({ partidoId, maxAvatares = 3 }) => {
  const { lideres, loading, error, getMejorJugadorGeneral } = useLideresPartido(partidoId);

  if (loading || error || !lideres) return null;

  const mejorJugador = getMejorJugadorGeneral();
  
  if (!mejorJugador) return null;

  const jugadorImageUrl = useImage(mejorJugador.jugador?.imagen);

  return (
    <Tooltip
      title={`MVP: ${mejorJugador.jugador?.nombre} (${mejorJugador.apariciones} categorías)`}
      arrow
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={jugadorImageUrl}
          sx={{
            width: 28,
            height: 28,
            border: '2px solid #ffd700',
            fontSize: '0.6rem',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }}
        >
          #{mejorJugador.jugador?.numero || '?'}
        </Avatar>
        
        {/* 👑 Corona de MVP */}
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#ffd700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.6rem'
          }}
        >
          👑
        </Box>
      </Box>
    </Tooltip>
  );
};