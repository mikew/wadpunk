import { ApolloClient, InMemoryCache } from '@apollo/client'

import tauriGraphqlApolloLink from '#src/tauri/tauriGraphqlApolloLink'

import type { Query } from './types'
// import tauriGraphqlHttpLink from '#src/tauri/tauriGraphqlHttpLink'

const apolloCache = new InMemoryCache()

const graphqlClient = new ApolloClient({
  cache: apolloCache,
  link: tauriGraphqlApolloLink,
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
