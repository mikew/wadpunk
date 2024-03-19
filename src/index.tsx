import { ApolloProvider } from '@apollo/client'
import { CssBaseline, Slide, ThemeProvider } from '@mui/material'
import { setFilterStore } from '@promoboxx/use-filter/dist/store'
import localStorageStore from '@promoboxx/use-filter/dist/store/localStorageStore'
import { SnackbarProvider } from 'notistack'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import App from './app/App'
import theme from './app/theme'
import graphqlClient from './graphql/graphqlClient'
import NotistackMuiAlert from './mui/NotistackMuiAlert'
import createRootStore from './redux/createRootStore'

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
              <App />
            </CssBaseline>
          </SnackbarProvider>
        </ThemeProvider>
      </StrictMode>
    </ApolloProvider>
  </Provider>,
)
