import { useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { GetGameListQueryDocument } from '@src/graphql/operations'
import { Game } from '@src/graphql/types'

const defaultTags = ['iwad', 'tc', 'mod']

function useAllTags() {
  const { data } = useQuery(GetGameListQueryDocument)

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
