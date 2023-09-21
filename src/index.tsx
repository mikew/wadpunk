import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  listItemClasses,
} from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './app/App'
import tauriGraphqlApolloLink from './tauri/tauriGraphqlApolloLink'
// import tauriGraphqlHttpLink from './tauri/tauriGraphqlHttpLink'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: tauriGraphqlApolloLink,
  // link: tauriGraphqlHttpLink,
})

const ROUNDED_BORDER_RADIUS = 9999

const theme = createTheme({
  palette: {
    mode: 'dark',
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
      styleOverrides: {
        root: {
          pointerEvents: 'initial',
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <App />
        </CssBaseline>
      </ThemeProvider>
    </React.StrictMode>
  </ApolloProvider>,
)
