import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  EmojiEvents as EmojiEventsIcon,
  PersonAdd as PersonAddIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axiosInstance from '../../config/axios';
import { InscripcionesTorneo } from './InscripcionesTorneo';
import { getCategoryName } from '../../helpers/mappings';

export const GestionInscripciones = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_BACKEND_URL || '';

  const [torneo, setTorneo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTorneo();
  }, [id]);

  const obtenerTorneo = async () => {
    try {
      setCargando(true);
      const { data } = await axiosInstance.get(`/torneos/${id}`);
      setTorneo(data.torneo);
    } catch (error) {
      console.error('Error al obtener torneo:', error);
      setError('Error al cargar la información del torneo');
    } finally {
      setCargando(false);
    }
  };

  const handleEquiposActualizados = (torneoActualizado) => {
    setTorneo(torneoActualizado);
  };

  const volver = () => {
    navigate('/torneos');
  };

  if (cargando) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !torneo) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Torneo no encontrado'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={volver}
        >
          Volver a Torneos
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      p: { xs: 2, md: 4 },
      backgroundImage: 'linear-gradient(to bottom right, rgba(20, 20, 40, 0.9), rgba(10, 10, 30, 0.95))',
      minHeight: 'calc(100vh - 64px)',
      borderRadius: 2
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
        >
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={volver}
            sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}
          >
            Torneos
          </Link>
          <Link 
            underline="hover" 
            color="inherit" 
            onClick={() => navigate(`/torneos`)}
            sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }}
          >
            {torneo.nombre}
          </Link>
          <Typography color="primary">Gestión de Inscripciones</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontWeight: 'bold',
              borderLeft: '4px solid #3f51b5',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <PersonAddIcon sx={{ color: '#64b5f6' }} />
              Gestión de Inscripciones
            </Typography>
            <Typography variant="h6" sx={{ 
              color: 'rgba(255,255,255,0.8)',
              pl: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20 }} />
              {torneo.nombre}
            </Typography>
          </Box>
          
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={volver}
            sx={{
              borderRadius: 2,
              borderWidth: 2,
              py: 1,
              px: 3,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Volver a Torneos
          </Button>
        </Box>

        {/* Información del torneo */}
        <Card sx={{ 
          bgcolor: 'rgba(0, 0, 0, 0.7)', 
          borderRadius: 3,
          mb: 4,
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 3,
              flexWrap: 'wrap'
            }}>
              {torneo.imagen && (
                <Box
                  component="img"
                  src={`${API_URL}/uploads/${torneo.imagen}`}
                  alt={torneo.nombre}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    objectFit: 'cover'
                  }}
                />
              )}
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  {torneo.nombre}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Chip 
                    label={`${torneo.equipos?.length || 0} equipos inscritos`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${torneo.categorias?.length || 0} categorías`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap'
                }}>
                  {torneo.categorias?.map(categoria => (
                    <Chip
                      key={categoria}
                      label={getCategoryName([categoria])}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Componente de inscripciones */}
        <InscripcionesTorneo 
          torneo={torneo}
          onEquiposActualizados={handleEquiposActualizados}
        />
      </motion.div>
    </Box>
  );
};