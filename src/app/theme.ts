import { createTheme, listItemClasses } from '@mui/material'

const ROUNDED_BORDER_RADIUS = 9999

const theme = createTheme({
  palette: {
    mode: 'dark',

    background: {
      default: '#1f170b',
      paper: '#3f2b1b',
    },

    primary: {
      main: '#ff8f3b',
    },

    info: {
      main: '#7373ff',
    },
    warning: {
      main: '#ff8f3b',
    },
    success: {
      main: '#77ff6f',
    },
    error: {
      main: '#9b3333',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontSize: 14,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  components: {
    MuiListItem: {
      styleOverrides: {
        divider: {
          '&:last-child': {
            borderBottomWidth: 0,
          },
        },
        container: {
          [`&:last-child .${listItemClasses.divider}`]: {
            borderBottomWidth: 0,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        divider: {
          '&:last-child': {
            borderBottomWidth: 0,
          },
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          cursor: 'pointer',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },

    MuiFormControl: {
      defaultProps: {
        margin: 'normal',
        fullWidth: true,
        variant: 'filled',
      },
    },
    MuiSelect: {
      defaultProps: {
        fullWidth: true,
        variant: 'filled',
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: 'filled',
      },
    },

    MuiButton: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          // There's no need for buttons to yell at everyone.
          textTransform: 'initial',
        },
        contained: {
          borderRadius: ROUNDED_BORDER_RADIUS,
        },
        outlined: {
          borderRadius: ROUNDED_BORDER_RADIUS,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: ROUNDED_BORDER_RADIUS,
        },
        bar: {
          borderRadius: ROUNDED_BORDER_RADIUS,
        },
      },
    },

    MuiSnackbar: {
      styleOverrides: {
        root: {
          pointerEvents: 'none',
        },
      },
    },
    MuiAlert: {
      defaultProps: {
        variant: 'filled',
      },
      styleOverrides: {
        root: {
          pointerEvents: 'initial',
        },
      },
    },
  },
})

export default theme
