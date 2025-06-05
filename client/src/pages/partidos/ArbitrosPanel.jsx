import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  LinearProgress
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Person as PersonIcon,
  Star as StarIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useImage } from '../../hooks/useImage';
import { 
  getNivelArbitroName, 
  getPosicionName, 
  getEstadoArbitroName,
  getNivelColor
} from '../../helpers/arbitroMappings';

const ArbitrosPanel = ({ partido }) => {
  const arbitros = partido?.arbitros || {};

  // 🔥 Componente para información detallada de árbitro
  const ArbitroDetallado = ({ arbitro, posicion, esPrincipal = false }) => {
    if (!arbitro) return null;

    const arbitroImageUrl = useImage(arbitro.usuario?.imagen, '');
    const nivelColor = getNivelColor(arbitro.nivel);

    return (
      <Paper
        sx={{
          backgroundColor: esPrincipal 
            ? 'rgba(255, 193, 7, 0.1)' 
            : 'rgba(255, 255, 255, 0.05)',
          border: esPrincipal 
            ? '2px solid rgba(255, 193, 7, 0.3)' 
            : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          p: 3,
          height: '100%',
          position: 'relative'
        }}
      >
        {/* Badge de posición */}
        <Chip
          label={getPosicionName(posicion)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: esPrincipal ? '#ffc107' : '#64b5f6',
            color: 'white',
            fontWeight: 'bold'
          }}
        />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          gap: 2
        }}>
          {/* Avatar y nombre */}
          <Avatar
            src={arbitroImageUrl}
            alt={`Foto de ${arbitro.usuario?.nombre}`}
            sx={{ 
              width: 80, 
              height: 80,
              border: `3px solid ${esPrincipal ? '#ffc107' : '#64b5f6'}`,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <GavelIcon sx={{ fontSize: 40 }} />
          </Avatar>

          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                mb: 1
              }}
            >
              {arbitro.usuario?.nombre || 'Árbitro'}
            </Typography>

            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                mb: 2
              }}
            >
              {arbitro.usuario?.email}
            </Typography>
          </Box>

          {/* Información profesional */}
          <Box sx={{ width: '100%', space: 2 }}>
            {/* Nivel y experiencia */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              p: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkspacePremiumIcon sx={{ color: nivelColor, fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {getNivelArbitroName(arbitro.nivel)}
                </Typography>
              </Box>
              
              <Chip
                label={`${arbitro.experiencia || 0} años`}
                size="small"
                variant="outlined"
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }}
              />
            </Box>

            {/* Rating */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Calificación
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating 
                  value={arbitro.rating || 0} 
                  readOnly 
                  precision={0.1}
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#ffc107'
                    },
                    '& .MuiRating-iconEmpty': {
                      color: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ color: '#ffc107', fontWeight: 'bold', ml: 1 }}>
                  {arbitro.rating ? arbitro.rating.toFixed(1) : 'N/A'}
                </Typography>
              </Box>
            </Box>

            {/* Partidos dirigidos */}
            <Box sx={{ 
              textAlign: 'center',
              backgroundColor: 'rgba(100, 181, 246, 0.1)',
              borderRadius: 2,
              p: 2,
              border: '1px solid rgba(100, 181, 246, 0.2)'
            }}>
              <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                {arbitro.partidosDirigidos || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Partidos Dirigidos
              </Typography>
            </Box>
          </Box>

          {/* Información de contacto (si disponible) */}
          {(arbitro.telefono || arbitro.ubicacion) && (
            <Box sx={{ 
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              p: 2,
              mt: 2
            }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Contacto
              </Typography>
              
              {arbitro.telefono && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {arbitro.telefono}
                  </Typography>
                </Box>
              )}
              
              {arbitro.ubicacion && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon sx={{ fontSize: 16, color: '#64b5f6' }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {arbitro.ubicacion}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Certificaciones */}
          {arbitro.certificaciones && arbitro.certificaciones.length > 0 && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                Certificaciones
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {arbitro.certificaciones.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    size="small"
                    variant="outlined"
                    sx={{
                      color: '#4caf50',
                      borderColor: '#4caf50',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  // 🔥 Componente para árbitro no asignado
  const ArbitroVacio = ({ posicion }) => (
    <Paper
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <Avatar
        sx={{ 
          width: 60, 
          height: 60,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          mb: 2
        }}
      >
        <PersonIcon sx={{ fontSize: 30, color: 'rgba(255, 255, 255, 0.3)' }} />
      </Avatar>
      
      <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1 }}>
        {getPosicionName(posicion)}
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
        No asignado
      </Typography>
    </Paper>
  );

  // 🔥 Panel de estadísticas de arbitraje
  const EstadisticasArbitraje = () => {
    const arbitrosAsignados = Object.values(arbitros).filter(Boolean);
    const promedioExperiencia = arbitrosAsignados.length > 0 
      ? arbitrosAsignados.reduce((sum, arb) => sum + (arb.experiencia || 0), 0) / arbitrosAsignados.length
      : 0;
    const promedioRating = arbitrosAsignados.length > 0 
      ? arbitrosAsignados.reduce((sum, arb) => sum + (arb.rating || 0), 0) / arbitrosAsignados.length
      : 0;
    const totalPartidosDirigidos = arbitrosAsignados.reduce((sum, arb) => sum + (arb.partidosDirigidos || 0), 0);

    return (
      <Paper
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
          p: 3,
          mb: 3
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
          Estadísticas del Equipo de Arbitraje
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                {arbitrosAsignados.length}/3
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Árbitros Asignados
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {promedioExperiencia.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Años Promedio
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ffc107', fontWeight: 'bold' }}>
                {promedioRating.toFixed(1)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Rating Promedio
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                {totalPartidosDirigidos}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Partidos Totales
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Barra de progreso del equipo */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              Completitud del Equipo
            </Typography>
            <Typography variant="body2" sx={{ color: '#64b5f6' }}>
              {Math.round((arbitrosAsignados.length / 3) * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(arbitrosAsignados.length / 3) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: arbitrosAsignados.length === 3 ? '#4caf50' : '#64b5f6'
              }
            }}
          />
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Equipo de Arbitraje
      </Typography>

      {/* Estadísticas del equipo */}
      <EstadisticasArbitraje />

      {/* Grid de árbitros */}
      <Grid container spacing={3}>
        {/* Árbitro Principal */}
        <Grid item xs={12} lg={4}>
          {arbitros.principal ? (
            <ArbitroDetallado 
              arbitro={arbitros.principal} 
              posicion="principal" 
              esPrincipal={true}
            />
          ) : (
            <ArbitroVacio posicion="principal" />
          )}
        </Grid>

        {/* Back Judge */}
        <Grid item xs={12} lg={4}>
          {arbitros.backeador ? (
            <ArbitroDetallado 
              arbitro={arbitros.backeador} 
              posicion="backeador"
            />
          ) : (
            <ArbitroVacio posicion="backeador" />
          )}
        </Grid>

        {/* Estadístico */}
        <Grid item xs={12} lg={4}>
          {arbitros.estadistico ? (
            <ArbitroDetallado 
              arbitro={arbitros.estadistico} 
              posicion="estadistico"
            />
          ) : (
            <ArbitroVacio posicion="estadistico" />
          )}
        </Grid>
      </Grid>

      {/* Lista compacta alternativa para pantallas pequeñas */}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 3 }}>
        <Paper
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }}
        >
          <List>
            {['principal', 'backeador', 'estadistico'].map((posicion, index) => {
              const arbitro = arbitros[posicion];
              const arbitroImageUrl = useImage(arbitro?.usuario?.imagen, '');
              
              return (
                <ListItem key={posicion} divider={index < 2}>
                  <ListItemAvatar>
                    <Avatar src={arbitroImageUrl}>
                      <GavelIcon />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {arbitro?.usuario?.nombre || 'No asignado'}
                        </Typography>
                        {posicion === 'principal' && (
                          <Chip 
                            label="Principal" 
                            size="small" 
                            color="warning"
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {getPosicionName(posicion)}
                        </Typography>
                        {arbitro && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Chip
                              label={getNivelArbitroName(arbitro.nivel)}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                color: getNivelColor(arbitro.nivel),
                                borderColor: getNivelColor(arbitro.nivel)
                              }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ fontSize: 14, color: '#ffc107' }} />
                              <Typography variant="caption" sx={{ color: '#ffc107' }}>
                                {arbitro.rating ? arbitro.rating.toFixed(1) : 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>

      {/* Mensaje si no hay árbitros asignados */}
      {!arbitros.principal && !arbitros.backeador && !arbitros.estadistico && (
        <Paper
          sx={{
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            mt: 3
          }}
        >
          <GavelIcon sx={{ fontSize: 48, color: '#ff9800', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#ff9800', mb: 1 }}>
            Sin Árbitros Asignados
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Este partido aún no tiene árbitros asignados. Es recomendable asignar al menos un árbitro principal antes del inicio del partido.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ArbitrosPanel;