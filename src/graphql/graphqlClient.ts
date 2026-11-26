import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { ErrorLink } from '@apollo/client/link/error'
import { enqueueSnackbar } from 'notistack'

import tauriGraphqlApolloLink from '#src/tauri/tauriGraphqlApolloLink'

import type { Query } from './types'
// import tauriGraphqlHttpLink from '#src/tauri/tauriGraphqlHttpLink'

const apolloCache = new InMemoryCache()

const mutationErrorLink = new ErrorLink(({ error, operation }) => {
  if (
    operation.operationType !== 'mutation' ||
    operation.getContext().handleErrorLocally
  ) {
    return
  }

  enqueueSnackbar(error.message, { variant: 'error' })
})

const graphqlClient = new ApolloClient({
  cache: apolloCache,
  link: ApolloLink.from([mutationErrorLink, tauriGraphqlApolloLink]),
  // link: tauriGraphqlHttpLink,
})

export const invalidateApolloQuery = (queryNames: (keyof Query)[]) => {
  const response = queryNames.map((queryName) =>
    apolloCache.evict({
      id: 'ROOT_QUERY',
      fieldName: queryName,
    }),
  )

  // See note towards the end of
  // https://www.apollographql.com/docs/react/caching/garbage-collection/#cacheevict
  apolloCache.gc()

  return response
}

export const invalidateApolloCache = () => {
  apolloCache.reset()

  // See note towards the end of
  // https://www.apollographql.com/docs/react/caching/garbage-collection/#cacheevict
  apolloCache.gc()
}

export default graphqlClient
