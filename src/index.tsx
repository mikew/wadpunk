import { CssVarsProvider, CssBaseline } from '@mui/joy'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createClient, Provider as UrqlProvider } from 'urql'

import { invokeExchange } from './tauri/tauriPluginGraphqlUrqlExchange'

const client = createClient({
  url: 'graphql',
  exchanges: [invokeExchange],
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <UrqlProvider value={client}>
    <React.StrictMode>
      <CssVarsProvider>
        <CssBaseline>
          <App />
        </CssBaseline>
      </CssVarsProvider>
    </React.StrictMode>
  </UrqlProvider>,
)
