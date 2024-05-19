import { useQuery, useSuspenseQuery } from '@apollo/client'
import { useMemo } from 'react'

import type { Game } from '#src/graphql/types'

import { GetGameListQueryDocument } from './operations.generated'

const defaultTags = ['iwad', 'tc', 'mod', 'playing']

function useAllTags(suspense = false) {
  // This won't change at runtime, and if it does, an error will be thrown
  // anyways.
  const { data } = suspense
    ? // eslint-disable-next-line react-hooks/rules-of-hooks -- see above
      useSuspenseQuery(GetGameListQueryDocument)
    : // eslint-disable-next-line react-hooks/rules-of-hooks -- see above
      useQuery(GetGameListQueryDocument)

  const tags = useMemo(() => {
    const tags: Game['tags'] = []

    for (const game of data?.getGames || []) {
      for (const tag of game.tags) {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      }
    }

    for (const defaultTag of defaultTags) {
      if (!tags.includes(defaultTag)) {
        tags.push(defaultTag)
      }
    }

    return tags
  }, [data?.getGames])

  return tags
}

export default useAllTags
