import { useSuspenseQuery } from '@apollo/client'
import { useMemo } from 'react'

import { GetAllSourcePortsDocument } from '#src/graphql/operations'

function useAllSourcePorts() {
  const { data, refetch } = useSuspenseQuery(GetAllSourcePortsDocument)

  const sortedSourcePorts = useMemo(() => {
    return [...data.getSourcePorts].sort((a, b) => {
      return a.id.localeCompare(b.id)
    })
  }, [data.getSourcePorts])

  const defaultSourcePort = data.getSourcePorts.find((x) => x.is_default)

  return {
    sourcePorts: sortedSourcePorts,
    defaultSourcePort,
    refetch,
  }
}

export default useAllSourcePorts
