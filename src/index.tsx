import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { setFilterStore } from '@promoboxx/use-filter/dist/store'
import localStorageStore from '@promoboxx/use-filter/dist/store/localStorageStore'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './app/App'
import theme from './app/theme'
import tauriGraphqlApolloLink from './tauri/tauriGraphqlApolloLink'
// import tauriGraphqlHttpLink from './tauri/tauriGraphqlHttpLink'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: tauriGraphqlApolloLink,
  // link: tauriGraphqlHttpLink,
})

setFilterStore(localStorageStore)

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find root element')
}

ReactDOM.createRoot(rootElement).render(
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
