import React from 'react';
import { IconButton, Tooltip, Button } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// 🔧 Componente para botón de editar partido
export const BotonEditarPartido = ({ 
  partido, 
  variant = 'icon', // 'icon' | 'button'
  size = 'medium',
  showTooltip = true 
}) => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // 🔐 Verificar permisos
  const puedeEditar = () => {
    if (!usuario || !partido) return false;
    
    const esAdmin = usuario.rol === 'admin';
    const esArbitro = usuario.rol === 'arbitro';
    const partidoProgramado = partido.estado === 'programado';
    
    // Admin puede editar siempre, árbitro solo partidos programados
    return esAdmin || (esArbitro && partidoProgramado);
  };

  // 📝 Obtener mensaje del tooltip
  const getTooltipMessage = () => {
    if (!usuario) return 'Debes iniciar sesión';
    if (!puedeEditar()) {
      if (usuario.rol === 'arbitro' && partido.estado !== 'programado') {
        return 'Solo puedes editar partidos programados';
      }
      return 'No tienes permisos para editar este partido';
    }
    return 'Editar partido';
  };

  // 🎯 Manejar click
  const handleEditar = () => {
    if (puedeEditar()) {
      navigate(`/partidos/${partido._id}/editar`);
    }
  };

  // 🚫 No mostrar si no hay permisos y no es admin/arbitro
  if (!usuario || (usuario.rol !== 'admin' && usuario.rol !== 'arbitro')) {
    return null;
  }

  // 🎨 Renderizar según variante
  if (variant === 'button') {
    const ButtonComponent = (
      <Button
        onClick={handleEditar}
        disabled={!puedeEditar()}
        startIcon={<EditIcon />}
        size={size}
        variant="outlined"
        sx={{
          borderColor: puedeEditar() ? '#64b5f6' : 'rgba(255, 255, 255, 0.3)',
          color: puedeEditar() ? '#64b5f6' : 'rgba(255, 255, 255, 0.5)',
          '&:hover': {
            borderColor: puedeEditar() ? '#42a5f5' : 'rgba(255, 255, 255, 0.3)',
            backgroundColor: puedeEditar() ? 'rgba(100, 181, 246, 0.1)' : 'transparent'
          },
          '&:disabled': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }}
      >
        Editar
      </Button>
    );

    return showTooltip ? (
      <Tooltip title={getTooltipMessage()} arrow>
        <span>
          {ButtonComponent}
        </span>
      </Tooltip>
    ) : ButtonComponent;
  }

  // Variante icon (default)
  const IconButtonComponent = (
    <IconButton
      onClick={handleEditar}
      disabled={!puedeEditar()}
      size={size}
      sx={{
        color: puedeEditar() ? '#64b5f6' : 'rgba(255, 255, 255, 0.5)',
        '&:hover': {
          backgroundColor: puedeEditar() ? 'rgba(100, 181, 246, 0.1)' : 'transparent'
        },
        '&:disabled': {
          color: 'rgba(255, 255, 255, 0.3)'
        }
      }}
    >
      <EditIcon />
    </IconButton>
  );

  return showTooltip ? (
    <Tooltip title={getTooltipMessage()} arrow>
      <span>
        {IconButtonComponent}
      </span>
    </Tooltip>
  ) : IconButtonComponent;
};