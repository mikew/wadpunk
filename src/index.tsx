import { CssVarsProvider, CssBaseline } from '@mui/joy'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import tauriGraphqlApolloLink from './tauri/tauriGraphqlApolloLink'
import tauriGraphqlHttpLink from './tauri/tauriGraphqlHttpLink'
// import { createClient, Provider as UrqlProvider } from 'urql'

// import { invokeExchange } from './tauri/tauriPluginGraphqlUrqlExchange'

// const client = createClient({
//   url: 'graphql',
//   exchanges: [invokeExchange],
// })

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: tauriGraphqlApolloLink,
  // link: tauriGraphqlHttpLink,
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <UrqlProvider value={client}>
  <ApolloProvider client={client}>
    <React.StrictMode>
      <CssVarsProvider>
        <CssBaseline>
          <App />
        </CssBaseline>
      </CssVarsProvider>
    </React.StrictMode>
  </ApolloProvider>,
  // </UrqlProvider>,
)
