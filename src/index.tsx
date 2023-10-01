import { ApolloProvider } from '@apollo/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { setFilterStore } from '@promoboxx/use-filter/dist/store'
import localStorageStore from '@promoboxx/use-filter/dist/store/localStorageStore'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/App'
import theme from './app/theme'
import graphqlClient from './graphql/graphqlClient'

setFilterStore(localStorageStore)

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find root element')
}

createRoot(rootElement).render(
  <ApolloProvider client={graphqlClient}>
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <App />
        </CssBaseline>
      </ThemeProvider>
    </StrictMode>
  </ApolloProvider>,
)
