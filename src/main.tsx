import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createClient, Provider as UrqlProvider } from 'urql'

import './styles.css'
import { invokeExchange } from './tauri/tauriPluginGraphqlUrqlExchange'

const client = createClient({
  url: 'graphql', // this value is important, don't touch
  exchanges: [invokeExchange],
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <UrqlProvider value={client}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
    ,
  </UrqlProvider>,
)
