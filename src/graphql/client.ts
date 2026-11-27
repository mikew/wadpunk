import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { enqueueSnackbar } from 'notistack'

import tauriGraphqlApolloLink from '#src/tauri/tauriGraphqlApolloLink'

// import tauriGraphqlHttpLink from '#src/tauri/tauriGraphqlHttpLink'

const mutationErrorLink = new ErrorLink(({ error, operation }) => {
  if (
    operation.operationType !== 'mutation' ||
    operation.getContext().handleErrorLocally
  ) {
    return
  }

  enqueueSnackbar(error.message, { variant: 'error' })
})

// Create a new client per router, so nothing is shared at the module level.
function createApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([mutationErrorLink, tauriGraphqlApolloLink]),
    // link: tauriGraphqlHttpLink,
  })
}

export default createApolloClient
