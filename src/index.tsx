import { ApolloProvider } from '@apollo/client/react'
import {
  Box,
  CircularProgress,
  CssBaseline,
  Slide,
  ThemeProvider,
} from '@mui/material'
import { setFilterStore } from '@promoboxx/use-filter/store'
import localStorageStore from '@promoboxx/use-filter/store/localStorageStore'
import { SnackbarProvider } from 'notistack'
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import RootErrorBoundary from './app/RootErrorBoundary'
import theme from './app/theme'
import graphqlClient from './graphql/graphqlClient'
import I18nLoader from './i18n/I18nLoader'
import { ConfirmDialog, ConfirmDialogProvider } from './lib/ConfirmDialog'
import NotistackMuiAlert from './mui/NotistackMuiAlert'
import createRootStore from './redux/createRootStore'
import TauriExternalLinkHandler from './tauri/TauriExternalLinkHandler'
import TauriUpdateNotifier from './tauri/TauriUpdateNotifier'

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
          <CssBaseline>
            <Suspense
              fallback={
                <Box
                  sx={{
                    padding: 4,
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress />
                </Box>
              }
            >
              <I18nLoader>
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
                  <RootErrorBoundary>
                    <ConfirmDialogProvider>
                      <App />

                      <ConfirmDialog />

                      <TauriUpdateNotifier />

                      <TauriExternalLinkHandler />
                    </ConfirmDialogProvider>
                  </RootErrorBoundary>
                </SnackbarProvider>
              </I18nLoader>
            </Suspense>
          </CssBaseline>
        </ThemeProvider>
      </StrictMode>
    </ApolloProvider>
  </Provider>,
)
