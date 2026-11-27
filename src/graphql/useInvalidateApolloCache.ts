import { useApolloClient } from '@apollo/client/react'
import { useCallback } from 'react'

import type { Query } from './types'

function useInvalidateApolloCache() {
  const client = useApolloClient()

  const invalidateApolloQuery = useCallback(
    (queryNames: (keyof Query)[]) => {
      const response = queryNames.map((queryName) =>
        client.cache.evict({
          id: 'ROOT_QUERY',
          fieldName: queryName,
        }),
      )

      // See note towards the end of
      // https://www.apollographql.com/docs/react/caching/garbage-collection/#cacheevict
      client.cache.gc()

      return response
    },
    [client],
  )

  const invalidateApolloCache = useCallback(() => {
    client.cache.reset()

    // See note towards the end of
    // https://www.apollographql.com/docs/react/caching/garbage-collection/#cacheevict
    client.cache.gc()
  }, [client])

  return { invalidateApolloQuery, invalidateApolloCache }
}

export default useInvalidateApolloCache
