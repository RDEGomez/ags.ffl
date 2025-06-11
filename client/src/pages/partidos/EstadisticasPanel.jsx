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
  LinearProgress,
  useTheme
} from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';

const EstadisticasPanel = ({ partido }) => {
  const theme = useTheme();
  const [estadisticas, setEstadisticas] = useState({});

  // 🔄 Calcular estadísticas directamente desde las jugadas
  useEffect(() => {
    if (!partido?.jugadas || partido.jugadas.length === 0) {
      setEstadisticas({
        equipoLocal: {
          pases: { intentos: 0, completados: 0, touchdowns: 0 },
          corridas: { intentos: 0, touchdowns: 0 },
          defensiva: { tackleos: 0, intercepciones: 0, sacks: 0 },
          especiales: { conversiones1Pto: 0, conversiones2Pts: 0, safeties: 0 }
        },
        equipoVisitante: {
          pases: { intentos: 0, completados: 0, touchdowns: 0 },
          corridas: { intentos: 0, touchdowns: 0 },
          defensiva: { tackleos: 0, intercepciones: 0, sacks: 0 },
          especiales: { conversiones1Pto: 0, conversiones2Pts: 0, safeties: 0 }
        }
      });
      return;
    }

    // Inicializar contadores
    const statsLocal = {
      pases: { intentos: 0, completados: 0, touchdowns: 0 },
      corridas: { intentos: 0, touchdowns: 0 },
      defensiva: { tackleos: 0, intercepciones: 0, sacks: 0 },
      especiales: { conversiones1Pto: 0, conversiones2Pts: 0, safeties: 0 }
    };
    
    const statsVisitante = {
      pases: { intentos: 0, completados: 0, touchdowns: 0 },
      corridas: { intentos: 0, touchdowns: 0 },
      defensiva: { tackleos: 0, intercepciones: 0, sacks: 0 },
      especiales: { conversiones1Pto: 0, conversiones2Pts: 0, safeties: 0 }
    };

    // Procesar cada jugada
    partido.jugadas.forEach(jugada => {
      // Determinar si el equipo en posesión es local
      const equipoEnPosesionId = jugada.equipoEnPosesion?._id || jugada.equipoEnPosesion;
      const equipoLocalId = partido.equipoLocal?._id || partido.equipoLocal;
      const esLocal = equipoEnPosesionId?.toString() === equipoLocalId?.toString();
      
      console.log('🔍 Procesando jugada:', {
        tipo: jugada.tipoJugada,
        equipoEnPosesion: equipoEnPosesionId,
        equipoLocal: equipoLocalId,
        esLocal,
        resultado: jugada.resultado
      });
      
      // Estadísticas según tipo de jugada
      switch(jugada.tipoJugada) {
        case 'pase_completo':
          if (esLocal) {
            statsLocal.pases.intentos++;
            statsLocal.pases.completados++;
            if (jugada.resultado?.touchdown) statsLocal.pases.touchdowns++;
          } else {
            statsVisitante.pases.intentos++;
            statsVisitante.pases.completados++;
            if (jugada.resultado?.touchdown) statsVisitante.pases.touchdowns++;
          }
          break;
          
        case 'pase_incompleto':
          if (esLocal) {
            statsLocal.pases.intentos++;
          } else {
            statsVisitante.pases.intentos++;
          }
          break;
          
        case 'corrida':
          if (esLocal) {
            statsLocal.corridas.intentos++;
            if (jugada.resultado?.touchdown) statsLocal.corridas.touchdowns++;
          } else {
            statsVisitante.corridas.intentos++;
            if (jugada.resultado?.touchdown) statsVisitante.corridas.touchdowns++;
          }
          break;
          
        case 'intercepcion':
          // ⚠️ CLAVE: La intercepción se anota al equipo DEFENSOR (el que NO tenía posesión)
          if (esLocal) {
            // Si el local tenía posesión, el visitante hace la intercepción
            statsVisitante.defensiva.intercepciones++;
            if (jugada.resultado?.touchdown) statsVisitante.pases.touchdowns++;
          } else {
            // Si el visitante tenía posesión, el local hace la intercepción
            statsLocal.defensiva.intercepciones++;
            if (jugada.resultado?.touchdown) statsLocal.pases.touchdowns++;
          }
          break;
          
        case 'sack':
          // ⚠️ CLAVE: El sack se anota al equipo DEFENSOR
          if (esLocal) {
            statsVisitante.defensiva.sacks++;
          } else {
            statsLocal.defensiva.sacks++;
          }
          break;
          
        case 'tackleo':
          // ⚠️ CLAVE: El tackleo se anota al equipo DEFENSOR
          if (esLocal) {
            statsVisitante.defensiva.tackleos++;
          } else {
            statsLocal.defensiva.tackleos++;
          }
          break;
          
        case 'touchdown':
          // Para touchdowns directos
          if (esLocal) {
            if (jugada.descripcion?.toLowerCase().includes('pase')) {
              statsLocal.pases.touchdowns++;
            } else {
              statsLocal.corridas.touchdowns++;
            }
          } else {
            if (jugada.descripcion?.toLowerCase().includes('pase')) {
              statsVisitante.pases.touchdowns++;
            } else {
              statsVisitante.corridas.touchdowns++;
            }
          }
          break;
          
        case 'conversion_1pt':
          if (esLocal) {
            statsLocal.especiales.conversiones1Pto++;
          } else {
            statsVisitante.especiales.conversiones1Pto++;
          }
          break;
          
        case 'conversion_2pt':
          if (esLocal) {
            statsLocal.especiales.conversiones2Pts++;
          } else {
            statsVisitante.especiales.conversiones2Pts++;
          }
          break;
          
        case 'safety':
          if (esLocal) {
            statsLocal.especiales.safeties++;
          } else {
            statsVisitante.especiales.safeties++;
          }
          break;
      }
    });
    
    console.log('📊 Estadísticas calculadas:', {
      local: statsLocal,
      visitante: statsVisitante
    });
    
    setEstadisticas({
      equipoLocal: statsLocal,
      equipoVisitante: statsVisitante
    });

  }, [partido?.jugadas, partido?.equipoLocal, partido?.equipoVisitante]);

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
          
          {/* Barra de progreso comparativa */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <LinearProgress 
              variant="determinate" 
              value={localPorcentaje} 
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(156, 39, 176, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#2196f3',
                  borderRadius: 4
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
                  backgroundColor: '#9c27b0',
                  borderRadius: 4
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

  // Si no hay jugadas registradas
  if (!partido?.jugadas || partido.jugadas.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <AssessmentIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          No hay estadísticas disponibles
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Las estadísticas se generarán automáticamente cuando se registren jugadas en el partido.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <AssessmentIcon />
          Estadísticas del Partido
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Basado en {partido.jugadas.length} jugada{partido.jugadas.length !== 1 ? 's' : ''} registrada{partido.jugadas.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Panel de Comparación Visual */}
      <Paper sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 3,
        mb: 3
      }}>
        {/* Nombres de equipos */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={5} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
              {partido?.equipoLocal?.nombre || 'Equipo Local'}
            </Typography>
          </Grid>
          <Grid item xs={2}></Grid>
          <Grid item xs={5} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
              {partido?.equipoVisitante?.nombre || 'Equipo Visitante'}
            </Typography>
          </Grid>
        </Grid>

        <ComparacionStat
          label="Touchdowns Totales"
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
          label="Intercepciones (Defensiva)"
          localValue={equipoLocal.defensiva?.intercepciones || 0}
          visitanteValue={equipoVisitante.defensiva?.intercepciones || 0}
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
              📊 {partido?.equipoLocal?.nombre || 'Equipo Local'}
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
                      Intercepciones (Def)
                    </TableCell>
                    <TableCell sx={{ color: '#f44336', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoLocal.defensiva?.intercepciones || 0}
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
              📊 {partido?.equipoVisitante?.nombre || 'Equipo Visitante'}
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
                      Intercepciones (Def)
                    </TableCell>
                    <TableCell sx={{ color: '#f44336', borderColor: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                      {equipoVisitante.defensiva?.intercepciones || 0}
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