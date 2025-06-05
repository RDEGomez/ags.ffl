import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';
import { getCategoryName } from '../../helpers/mappings';
import { useImage } from '../../hooks/useImage';

const EquipoInfo = ({ equipo, esLocal, marcador, variant = 'detallado' }) => {
  const equipoImageUrl = useImage(equipo?.imagen, '');

  // Variante compacta para listas y tarjetas
  if (variant === 'compacto') {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 2
      }}>
        <Avatar
          src={equipoImageUrl}
          alt={`Logo de ${equipo?.nombre}`}
          sx={{ 
            width: 40, 
            height: 40,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <GroupIcon />
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {equipo?.nombre || 'Equipo'}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'block'
            }}
          >
            {esLocal ? 'Local' : 'Visitante'} • {getCategoryName(equipo?.categoria)}
          </Typography>
        </Box>

        {marcador !== undefined && (
          <Box sx={{
            minWidth: 40,
            textAlign: 'center',
            backgroundColor: 'rgba(100, 181, 246, 0.1)',
            borderRadius: 1,
            p: 1
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64b5f6', 
                fontWeight: 'bold'
              }}
            >
              {marcador}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Variante horizontal para enfrentamientos
  if (variant === 'horizontal') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        flex: 1
      }}>
        <Avatar
          src={equipoImageUrl}
          alt={`Logo de ${equipo?.nombre}`}
          sx={{ 
            width: 60, 
            height: 60,
            border: '3px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            mb: 1
          }}
        >
          <GroupIcon sx={{ fontSize: 30 }} />
        </Avatar>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            maxWidth: '120px',
            mb: 0.5
          }}
        >
          {equipo?.nombre || 'Equipo'}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic'
          }}
        >
          {esLocal ? 'Local' : 'Visitante'}
        </Typography>

        {marcador !== undefined && (
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#64b5f6', 
              fontWeight: 'bold',
              mt: 1
            }}
          >
            {marcador}
          </Typography>
        )}
      </Box>
    );
  }

  // Variante detallada para vista completa (por defecto)
  return (
    <Paper sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Avatar del equipo */}
      <Avatar
        src={equipoImageUrl}
        alt={`Logo de ${equipo?.nombre}`}
        sx={{ 
          width: 80, 
          height: 80,
          border: '4px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
          mb: 2
        }}
      >
        <GroupIcon sx={{ fontSize: 40 }} />
      </Avatar>
      
      {/* Nombre del equipo */}
      <Typography 
        variant="h5" 
        sx={{ 
          color: 'white', 
          fontWeight: 'bold',
          mb: 1
        }}
      >
        {equipo?.nombre || 'Equipo'}
      </Typography>
      
      {/* Tipo de equipo */}
      <Chip
        label={esLocal ? 'Equipo Local' : 'Equipo Visitante'}
        color={esLocal ? 'primary' : 'secondary'}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      
      {/* Categoría */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          mb: 2
        }}
      >
        {getCategoryName(equipo?.categoria)}
      </Typography>
      
      {/* Marcador */}
      {marcador !== undefined && (
        <Box sx={{
          backgroundColor: 'rgba(100, 181, 246, 0.1)',
          borderRadius: 2,
          p: 2,
          border: '1px solid rgba(100, 181, 246, 0.2)',
          width: '100%'
        }}>
          <Typography variant="caption" sx={{ color: '#64b5f6' }}>
            Puntos
          </Typography>
          <Typography 
            variant="h3" 
            sx={{ 
              color: '#64b5f6', 
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {marcador || 0}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EquipoInfo;