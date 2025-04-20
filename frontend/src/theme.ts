// src/theme.ts
import { createTheme } from '@mui/material/styles'
import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#00bfa5',         // vibrant teal
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff6f61',         // warm coral
      contrastText: '#ffffff',
    },
    error: {
      main: '#e53935',
    },
    background: {
      default: '#f5f7fa',      // very light grey
      paper:   '#ffffff',
    },
    text: {
      primary:   '#212121',
      secondary: '#616161',
    },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '0.5px',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
      letterSpacing: '0.5px',
    },
    body1: {
      fontWeight: 400,
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f7fa',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
          color: '#212121',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 64,
          padding: '0 24px',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,191,165,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: 3,
          backgroundColor: '#ff6f61',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
          marginRight: 16,
          '&.Mui-selected': {
            color: '#ff6f61',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          padding: 24,
        },
      },
    },
  },
})

export default theme
