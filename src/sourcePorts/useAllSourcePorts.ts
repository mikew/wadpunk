import { useSuspenseQuery } from '@apollo/client'
import { useCallback, useMemo } from 'react'

import { GetAllSourcePortsDocument } from '#src/graphql/operations'
import type { SourcePort } from '#src/graphql/types'

function useAllSourcePorts() {
  const { data, refetch } = useSuspenseQuery(GetAllSourcePortsDocument)

  const sortedSourcePorts = useMemo(() => {
    return [...data.getSourcePorts].sort((a, b) => {
      return a.id.localeCompare(b.id)
    })
  }, [data.getSourcePorts])

  const defaultSourcePort = data.getSourcePorts.find((x) => x.is_default)

  const findSourcePortById = useCallback(
    (id?: SourcePort['id'] | null) => {
      if (!id || id === '-1') {
        return defaultSourcePort
      }

      return data.getSourcePorts.find((x) => x.id === id)
    },
    [data.getSourcePorts, defaultSourcePort],
  )

  return {
    sourcePorts: sortedSourcePorts,
    defaultSourcePort,
    findSourcePortById,
    refetch,
  }
}

export default useAllSourcePorts
