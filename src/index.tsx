import { ApolloProvider } from '@apollo/client'
import {
  Box,
  CircularProgress,
  CssBaseline,
  Slide,
  ThemeProvider,
} from '@mui/material'
import { setFilterStore } from '@promoboxx/use-filter/dist/store'
import localStorageStore from '@promoboxx/use-filter/dist/store/localStorageStore'
import { SnackbarProvider } from 'notistack'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import theme from './app/theme'
import graphqlClient from './graphql/graphqlClient'
import I18nLoader from './i18n/I18nLoader'
import { ConfirmDialog, ConfirmDialogProvider } from './lib/ConfirmDialog'
import NotistackMuiAlert from './mui/NotistackMuiAlert'
import createRootStore from './redux/createRootStore'
import { SourcePortsProvider } from './sourcePorts/sourcePortsContext'

const App = lazy(() => import('./app/App'))

setFilterStore(localStorageStore)

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find root element')
}

createRoot(rootElement).render(
  <Provider store={createRootStore()}>
    <ApolloProvider client={graphqlClient}>
      <StrictMode>
        <ThemeProvider theme={theme}>
          <SnackbarProvider
            Components={{
              default: NotistackMuiAlert,
              info: NotistackMuiAlert,
              warning: NotistackMuiAlert,
              success: NotistackMuiAlert,
              error: NotistackMuiAlert,
            }}
            TransitionComponent={Slide}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            maxSnack={3}
          >
            <CssBaseline>
              <Suspense
                fallback={
                  <Box padding={4} justifyContent="center">
                    <CircularProgress />
                  </Box>
                }
              >
                <I18nLoader>
                  <SourcePortsProvider>
                    <ConfirmDialogProvider>
                      <App />
                      <ConfirmDialog />
                    </ConfirmDialogProvider>
                  </SourcePortsProvider>
                </I18nLoader>
              </Suspense>
            </CssBaseline>
          </SnackbarProvider>
        </ThemeProvider>
      </StrictMode>
    </ApolloProvider>
  </Provider>,
)
