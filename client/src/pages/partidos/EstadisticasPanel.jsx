import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  LinearProgress 
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

const EstadisticasPanel = ({ partido }) => {
  const estadisticas = partido?.estadisticas || {};
  const equipoLocal = estadisticas.equipoLocal || {};
  const equipoVisitante = estadisticas.equipoVisitante || {};

  // Helper para calcular porcentajes
  const calcularPorcentaje = (completados, intentos) => {
    if (!intentos || intentos === 0) return 0;
    return Math.round((completados / intentos) * 100);
  };

  // Helper para obtener el total de touchdowns
  const getTotalTouchdowns = (stats) => {
    return (stats.pases?.touchdowns || 0) + (stats.corridas?.touchdowns || 0);
  };

  // Componente para comparación estadística
  const ComparacionStat = ({ label, localValue, visitanteValue, tipo = 'numero' }) => {
    const total = localValue + visitanteValue;
    const localPorcentaje = total > 0 ? (localValue / total) * 100 : 50;
    const visitantePorcentaje = total > 0 ? (visitanteValue / total) * 100 : 50;

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'white', textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
          {label}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Valor Local */}
          <Box sx={{ width: 60, textAlign: 'right' }}>
            <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
              {tipo === 'porcentaje' ? `${localValue}%` : localValue}
            </Typography>
          </Box>

          {/* Barra de progreso */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={localPorcentaje}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: '#2196f3'
                }
              }}
            />
            <LinearProgress
              variant="determinate"
              value={visitantePorcentaje}
              sx={{
                height: 8,
                borderRadius: 4,
                position: 'absolute',
                top: 0,
                right: 0,
                left: `${localPorcentaje}%`,
                backgroundColor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: '#9c27b0'
                }
              }}
            />
          </Box>

          {/* Valor Visitante */}
          <Box sx={{ width: 60, textAlign: 'left' }}>
            <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {tipo === 'porcentaje' ? `${visitanteValue}%` : visitanteValue}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
        Estadísticas del Partido
      </Typography>

      {/* Marcador Principal */}
      <Paper sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        mb: 4
      }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          Marcador Final
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
              {partido?.marcador?.local || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {partido?.equipoLocal?.nombre}
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            -
          </Typography>
          <Box>
            <Typography variant="h3" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {partido?.marcador?.visitante || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {partido?.equipoVisitante?.nombre}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Comparación Visual */}
      <Paper sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
        mb: 4
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 3,
          justifyContent: 'center'
        }}>
          <AssessmentIcon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Comparación de Rendimiento
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={5} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
              {partido?.equipoLocal?.nombre}
            </Typography>
          </Grid>
          <Grid item xs={2}></Grid>
          <Grid item xs={5} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {partido?.equipoVisitante?.nombre}
            </Typography>
          </Grid>
        </Grid>

        <ComparacionStat
          label="Touchdowns"
          localValue={getTotalTouchdowns(equipoLocal)}
          visitanteValue={getTotalTouchdowns(equipoVisitante)}
        />

        <ComparacionStat
          label="Pases Completados"
          localValue={equipoLocal.pases?.completados || 0}
          visitanteValue={equipoVisitante.pases?.completados || 0}
        />

        <ComparacionStat
          label="Eficiencia de Pase"
          localValue={calcularPorcentaje(equipoLocal.pases?.completados, equipoLocal.pases?.intentos)}
          visitanteValue={calcularPorcentaje(equipoVisitante.pases?.completados, equipoVisitante.pases?.intentos)}
          tipo="porcentaje"
        />

        <ComparacionStat
          label="Intercepciones"
          localValue={equipoLocal.pases?.intercepciones || 0}
          visitanteValue={equipoVisitante.pases?.intercepciones || 0}
        />

        <ComparacionStat
          label="Sacks"
          localValue={equipoLocal.defensiva?.sacks || 0}
          visitanteValue={equipoVisitante.defensiva?.sacks || 0}
        />

        <ComparacionStat
          label="Tackleos"
          localValue={equipoLocal.defensiva?.tackleos || 0}
          visitanteValue={equipoVisitante.defensiva?.tackleos || 0}
        />
      </Paper>

      {/* Tablas Detalladas */}
      <Grid container spacing={3}>
        {/* Estadísticas Equipo Local */}
        <Grid item xs={12} md={6}>
          <Paper sx={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: 2,
            p: 3
          }}>
            <Typography variant="h6" sx={{ color: '#2196f3', mb: 2, textAlign: 'center' }}>
              {partido?.equipoLocal?.nombre}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      Categoría
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      Valor
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Pases Intentados
                    </TableCell>
                    <TableCell sx={{ color: '#64b5f6', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.pases?.intentos || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Pases Completados
                    </TableCell>
                    <TableCell sx={{ color: '#64b5f6', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.pases?.completados || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Eficiencia de Pase
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {calcularPorcentaje(equipoLocal.pases?.completados, equipoLocal.pases?.intentos)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      TDs de Pase
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.pases?.touchdowns || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      TDs de Corrida
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.corridas?.touchdowns || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Intercepciones
                    </TableCell>
                    <TableCell sx={{ color: '#f44336', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.pases?.intercepciones || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Sacks
                    </TableCell>
                    <TableCell sx={{ color: '#ff9800', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.defensiva?.sacks || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Tackleos
                    </TableCell>
                    <TableCell sx={{ color: '#9c27b0', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.defensiva?.tackleos || 0}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Estadísticas Equipo Visitante */}
        <Grid item xs={12} md={6}>
          <Paper sx={{
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: 2,
            p: 3
          }}>
            <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2, textAlign: 'center' }}>
              {partido?.equipoVisitante?.nombre}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      Categoría
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      Valor
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Pases Intentados
                    </TableCell>
                    <TableCell sx={{ color: '#64b5f6', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.pases?.intentos || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Pases Completados
                    </TableCell>
                    <TableCell sx={{ color: '#64b5f6', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.pases?.completados || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Eficiencia de Pase
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {calcularPorcentaje(equipoVisitante.pases?.completados, equipoVisitante.pases?.intentos)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      TDs de Pase
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.pases?.touchdowns || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      TDs de Corrida
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.corridas?.touchdowns || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Intercepciones
                    </TableCell>
                    <TableCell sx={{ color: '#f44336', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.pases?.intercepciones || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Sacks
                    </TableCell>
                    <TableCell sx={{ color: '#ff9800', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.defensiva?.sacks || 0}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
                      Tackleos
                    </TableCell>
                    <TableCell sx={{ color: '#9c27b0', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.defensiva?.tackleos || 0}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EstadisticasPanel;