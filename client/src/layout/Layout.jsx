import { Box, Toolbar, AppBar, IconButton, MenuItem, Typography, Drawer, Avatar, List, ListItem, ListItemText, ListItemIcon, useScrollTrigger, Slide, Container, Divider } from "@mui/material";
import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useOutlet } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import bgImage from '../../public/images/bgimage2.png';
import lacesLogoUrl from '../assets/laces.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "../context/AuthContext";

const drawerWidth = 280;

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  const baseUrl = `${import.meta.env.VITE_BACKEND_URL}/uploads/` || ''

  console.log(`${baseUrl}${usuario?.imagen}`)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const activeStyles = {
    color: '#3f51b5',
    background: 'rgba(255, 255, 255, 0.15)',
    borderLeft: '4px solid #3f51b5',
    fontWeight: 'bold',
  };

  // Item de menú para el drawer móvil
  const NavMenuItem = ({ to, icon, text, onClick }) => {
    const isActive = location.pathname === to;
    
    return (
      <NavLink 
        to={to} 
        style={{ textDecoration: 'none', color: 'white', display: 'block', margin: '8px 0' }}
        onClick={onClick}
      >
        <ListItem 
          button 
          sx={{ 
            borderRadius: '0 20px 20px 0',
            pl: 2,
            pr: 3,
            py: 1.5,
            transition: 'all 0.3s ease',
            backgroundColor: isActive ? 'rgba(63, 81, 181, 0.15)' : 'transparent',
            borderLeft: isActive ? '4px solid #3f51b5' : '4px solid transparent',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive ? '#3f51b5' : 'rgba(255, 255, 255, 0.7)',
            minWidth: '40px'
          }}>
            {icon}
          </ListItemIcon>
          <ListItemText 
            primary={text} 
            primaryTypographyProps={{ 
              sx: { 
                fontWeight: isActive ? 'bold' : 'normal',
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.8)'
              } 
            }}
          />
        </ListItem>
      </NavLink>
    );
  };

  // Contenido del Drawer para pantallas pequeñas
  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(180deg, rgba(15, 15, 35, 0.95) 0%, rgba(30, 30, 60, 0.9) 100%)',
    }}>
      {/* Header del drawer */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src={lacesLogoUrl}
            alt="Logo"
            sx={{ 
              height: 30, 
              mr: 2, 
              filter: 'brightness(0) invert(1)'
            }}
          />
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            backgroundImage: 'linear-gradient(45deg, #64b5f6, #2196f3)',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
          }}>
            Menú
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle} 
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Perfil de usuario */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        mb: 2,
      }}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2,
            border: '3px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'primary.main',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          }}
          src={usuario?.imagen ? `${baseUrl}${usuario.imagen}` : ''}
        >
          {(usuario?.nombre?.charAt(0) || usuario?.email?.charAt(0) || 'U').toUpperCase()}
        </Avatar>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'bold', 
          textAlign: 'center',
          color: 'white',
          mb: 1
        }}>
          {usuario?.nombre || 'Usuario'}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'rgba(63, 81, 181, 0.1)', 
          borderRadius: 20,
          px: 2,
          py: 0.5 
        }}>
          <Typography variant="caption" sx={{ color: '#64b5f6' }}>
            {usuario?.documento ? 'Verificado' : 'Usuario'}
          </Typography>
        </Box>
      </Box>

      {/* Enlaces de navegación */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        <NavMenuItem 
          to="/" 
          icon={<HomeIcon />} 
          text="Inicio" 
          onClick={handleDrawerToggle} 
        />
        <NavMenuItem 
          to="/usuarios" 
          icon={<PeopleIcon />} 
          text="Usuarios" 
          onClick={handleDrawerToggle} 
        />
        <NavMenuItem 
          to="/equipos" 
          icon={<SportsFootballIcon />} 
          text="Equipos" 
          onClick={handleDrawerToggle} 
        />
        <NavMenuItem 
          to="/torneos" 
          icon={<GroupsIcon />} 
          text="Torneos" 
          onClick={handleDrawerToggle} 
        />
        <NavMenuItem 
          to="/perfil" 
          icon={<PersonIcon />} 
          text="Mi Perfil" 
          onClick={handleDrawerToggle} 
        />
      </List>

      {/* Footer con botón de logout */}
      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          © LACES 2025
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<LogoutIcon />} 
          onClick={logout}
          size="small"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            px: 2
          }}
        >
          Salir
        </Button>
      </Box>
    </Box>
  );

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

  // Estilo para el AppBar flotante que siempre permanece visible
  const floatingAppBarStyle = {
    position: 'fixed',
    backgroundColor: 'rgba(10, 10, 30, 0.85)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    margin: '0 auto',
    width: '70%',
    left: '50%',
    transform: 'translateX(-50%)',
    top: '20px',
    zIndex: 1100,
    border: '1px solid rgba(255, 255, 255, 0.1)',
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

      {/* Barra flotante centrada para pantallas grandes que siempre permanece visible */}
      <AppBar
        sx={{
          ...floatingAppBarStyle,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <Toolbar sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2,
          height: '74px',
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src={lacesLogoUrl}
              alt="Logo"
              sx={{ 
                height: 40, 
                mr: 2, 
                filter: 'brightness(0) invert(1)',
              }}
            />
          </Box>

          {/* Menús de navegación */}
          <Box sx={{ display: 'flex', gap: 4 }}>
            <NavLink 
              to="/" 
              style={({ isActive }) => ({
                textDecoration: 'none', 
                color: isActive ? '#64b5f6' : 'white',
                borderBottom: isActive ? '2px solid #64b5f6' : '2px solid transparent',
                transition: 'all 0.3s ease',
                padding: '6px 0',
                fontWeight: isActive ? 'bold' : 'normal',
              })}
            >
              <Typography variant="body1">Inicio</Typography>
            </NavLink>
            <NavLink 
              to="/usuarios" 
              style={({ isActive }) => ({
                textDecoration: 'none', 
                color: isActive ? '#64b5f6' : 'white',
                borderBottom: isActive ? '2px solid #64b5f6' : '2px solid transparent',
                transition: 'all 0.3s ease',
                padding: '6px 0',
                fontWeight: isActive ? 'bold' : 'normal',
              })}
            >
              <Typography variant="body1">Usuarios</Typography>
            </NavLink>
            <NavLink 
              to="/equipos" 
              style={({ isActive }) => ({
                textDecoration: 'none', 
                color: isActive ? '#64b5f6' : 'white',
                borderBottom: isActive ? '2px solid #64b5f6' : '2px solid transparent',
                transition: 'all 0.3s ease',
                padding: '6px 0',
                fontWeight: isActive ? 'bold' : 'normal',
              })}
            >
              <Typography variant="body1">Equipos</Typography>
            </NavLink>
            <NavLink 
              to="/Torneos" 
              style={({ isActive }) => ({
                textDecoration: 'none', 
                color: isActive ? '#64b5f6' : 'white',
                borderBottom: isActive ? '2px solid #64b5f6' : '2px solid transparent',
                transition: 'all 0.3s ease',
                padding: '6px 0',
                fontWeight: isActive ? 'bold' : 'normal',
              })}
            >
              <Typography variant="body1">Torneos</Typography>
            </NavLink>
          </Box>

          {/* Botón de logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                backgroundColor: 'primary.main',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
              src={usuario?.imagen ? `${baseUrl}${usuario.imagen}` : ''}
            >
              {(usuario?.nombre?.charAt(0) || usuario?.email?.charAt(0) || 'U').toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.2 }}>
                {usuario?.nombre || 'Usuario'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1 }}>
                {usuario?.documento ? 'Verificado' : 'Usuario'}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mx: 1, height: '60%' }} />
            <IconButton 
              color="inherit" 
              onClick={logout}
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* AppBar pequeña para móviles que muestra solo el botón de menú */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'block', sm: 'none' },
          backgroundColor: 'rgba(10, 10, 25, 0.85)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="abrir menú"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={lacesLogoUrl}
            alt="Logo"
            sx={{ 
              height: 24,
              filter: 'brightness(0) invert(1)',
            }}
          />
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              backgroundColor: 'primary.main',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
            src={usuario?.imagen ? `${baseUrl}${usuario.imagen}` : ''}
          >
            {(usuario?.nombre?.charAt(0) || usuario?.email?.charAt(0) || 'U').toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Drawer para pantallas pequeñas con estilo mejorado */}
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
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
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

// Componente de botón con estilo
const Button = ({ children, variant, color, startIcon, onClick, size, sx, ...props }) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    cursor: 'pointer',
    fontWeight: 'medium',
    transition: 'all 0.2s ease',
    fontSize: size === 'small' ? '0.8rem' : '0.9rem',
    ...sx
  };

  const variantStyles = {
    contained: {
      backgroundColor: color === 'primary' ? '#3f51b5' : 
                      color === 'secondary' ? '#f50057' : 
                      color === 'error' ? '#f44336' : '#3f51b5',
      color: 'white',
      '&:hover': {
        backgroundColor: color === 'primary' ? '#303f9f' : 
                        color === 'secondary' ? '#c51162' : 
                        color === 'error' ? '#d32f2f' : '#303f9f',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      }
    },
    outlined: {
      backgroundColor: 'transparent',
      color: color === 'primary' ? '#3f51b5' : 
            color === 'secondary' ? '#f50057' : 
            color === 'error' ? '#f44336' : '#3f51b5',
      border: `1px solid ${
        color === 'primary' ? '#3f51b5' : 
        color === 'secondary' ? '#f50057' : 
        color === 'error' ? '#f44336' : '#3f51b5'
      }`,
      '&:hover': {
        backgroundColor: color === 'primary' ? 'rgba(63, 81, 181, 0.08)' : 
                        color === 'secondary' ? 'rgba(245, 0, 87, 0.08)' : 
                        color === 'error' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(63, 81, 181, 0.08)',
      }
    },
    text: {
      backgroundColor: 'transparent',
      color: color === 'primary' ? '#3f51b5' : 
            color === 'secondary' ? '#f50057' : 
            color === 'error' ? '#f44336' : '#3f51b5',
      '&:hover': {
        backgroundColor: color === 'primary' ? 'rgba(63, 81, 181, 0.08)' : 
                        color === 'secondary' ? 'rgba(245, 0, 87, 0.08)' : 
                        color === 'error' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(63, 81, 181, 0.08)',
      }
    }
  };

  const styles = {
    ...baseStyles,
    ...variantStyles[variant || 'contained']
  };

  return (
    <Box onClick={onClick} sx={styles} {...props}>
      {startIcon && startIcon}
      {children}
    </Box>
  );
};