import { Box, CircularProgress } from '@mui/material'
import { createRouter } from '@tanstack/react-router'

import createApolloClient from './graphql/client'
import createRootStore from './redux/createRootStore'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  store: ReturnType<typeof createRootStore>
  apolloClient: ReturnType<typeof createApolloClient>
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    context: {
      store: createRootStore(),
      apolloClient: createApolloClient(),
    },
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: PendingComponent,
  })

  return router
}

export function PendingComponent() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100dvh',

        color: 'action.disabled',
      }}
    >
      <CircularProgress variant="indeterminate" color="inherit" />
    </Box>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
