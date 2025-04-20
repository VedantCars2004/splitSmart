import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#C8E6C9',
      main:  '#81C784',
      dark:  '#519657',
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#FFECB3',
      main:  '#FFE082',
      dark:  '#FFD54F',
      contrastText: '#212121',
    },
    error: {
      main: '#E57373',
    },
    background: {
      default: '#F7F9F9',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#212121',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#212121',
    },
    h5: {
      fontWeight: 500,
      color: '#212121',
    },
    body1: {
      color: '#333333',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F8E9 100%)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 20px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#81C784',
          boxShadow: 'none',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#FFE082',
          height: 4,
          borderRadius: 2,
        },
      },
    },
  },
});

export default theme;
