import { Box, Toolbar, AppBar, IconButton, MenuItem, Typography, Drawer } from "@mui/material";
import { useState } from 'react';
import { NavLink, Outlet } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import bgImage from '../../public/images/bgimage2.png';
import lacesLogoUrl from  '../assets/laces.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";


const drawerWidth = 240;

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { usuario, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Contenido del Drawer para pantallas pequeñas
  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', color: 'white', paddingTop: '20px' }}>
      <Typography variant="h6" sx={{ my: 2 }}>Menú</Typography>
      <NavLink to="/" style={{ textDecoration: 'none', color: 'white' }}>
        <MenuItem>Inicio</MenuItem>
      </NavLink>
      <NavLink to="/usuarios" style={{ textDecoration: 'none', color: 'white' }}>
        <MenuItem>Usuarios</MenuItem>
      </NavLink>
      <NavLink to="/equipos" style={{ textDecoration: 'none', color: 'white' }}>
        <MenuItem>Equipos</MenuItem>
      </NavLink>
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            {usuario?.nombre || 'Usuario'}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  const outlet = useOutlet();
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.4,
  };

  return (
    <Box sx={{
      color: 'white',
      display: 'flex',
      minHeight: '100vh',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    }} className="animate__animated animate__fadeIn animate__faster">

      {/* Barra flotante centrada para pantallas grandes */}
      <Box sx={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        zIndex: 10,
        display: { xs: 'none', sm: 'block' },
      }}>
        <AppBar
          position="relative"
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            padding: '10px 20px',
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Botón para abrir el Drawer (puede estar visible o no, según lo que prefieras) */}
            <Box
              component="img"
              src={lacesLogoUrl}
              alt="Logo"
              sx={{ 
                height: 40, 
                mr: 2, 
                filter: 'brightness(0) invert(1)' // Esto hace que cualquier SVG sea blanco
              }}
            />

            {/* Menús de navegación */}
            <Box sx={{ display: 'flex', gap: 3 }}>
              <NavLink to="/" style={{ textDecoration: 'none', color: 'white' }}>
                <Typography variant="body1">Inicio</Typography>
              </NavLink>
              <NavLink to="/usuarios" style={{ textDecoration: 'none', color: 'white' }}>
                <Typography variant="body1">Usuarios</Typography>
              </NavLink>
              <NavLink to="/equipos" style={{ textDecoration: 'none', color: 'white' }}>
                <Typography variant="body1">Equipos</Typography>
              </NavLink>
            </Box>

            {/* Botón de logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {usuario?.nombre || 'Usuario'}
              </Typography>
              <IconButton color="inherit" onClick={logout}>
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      {/* AppBar pequeña para móviles que muestra solo el botón de menú */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', sm: 'none' },
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.5)',
          width: '100%',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
              component="img"
              src={lacesLogoUrl}
              alt="Logo"
              sx={{ 
                height: 20, 
                mr: 2, 
                filter: 'brightness(0) invert(1)',
                flexGrow: 1,
              }}
            />
          <IconButton color="inherit">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer para pantallas pequeñas */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Mejora el rendimiento en móviles
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          marginTop: { xs: '64px', sm: '120px' },
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.key}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};