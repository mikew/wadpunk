import { useSuspenseQuery } from '@apollo/client'
import type { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import { createContext, memo, useContext, useMemo } from 'react'

import type {
  GetAllSourcePortsQuery,
  GetAllSourcePortsQueryVariables,
} from '#src/graphql/operations'
import { GetAllSourcePortsDocument } from '#src/graphql/operations'
import type { SourcePort } from '#src/graphql/types'

import type { KnownSourcePortListItem, SourcePortListSourcePort } from './types'

interface SourcePortsContextType {
  sourcePorts: SourcePortListSourcePort[]
  knownSourcePorts: KnownSourcePortListItem[]
  defaultSourcePort?: SourcePortListSourcePort
  findSourcePortById: (
    id?: SourcePort['id'] | null,
  ) => SourcePortListSourcePort | undefined
  refetch: RefetchFunction<
    GetAllSourcePortsQuery,
    GetAllSourcePortsQueryVariables
  >
}

const sourcePortsContext = createContext<SourcePortsContextType | undefined>(
  undefined,
)

export const SourcePortsProvider: React.FC<React.PropsWithChildren> = memo(
  (props) => {
    const { data, refetch } = useSuspenseQuery(GetAllSourcePortsDocument)

    const contextValue = useMemo(() => {
      const sortedSourcePorts = [...data.getSourcePorts].sort((a, b) => {
        return a.id.localeCompare(b.id)
      })

      const sortedKnownSourcePorts = [...data.getKnownSourcePorts].sort(
        (a, b) => {
          return a.name.localeCompare(b.name)
        },
      )

      const defaultSourcePort =
        data.getSourcePorts.find((x) => x.is_default) || data.getSourcePorts[0]

      const findSourcePortById = (id?: SourcePort['id'] | null) => {
        if (!id || id === '-1') {
          return defaultSourcePort
        }

        return data.getSourcePorts.find((x) => x.id === id)
      }

      const contextValue: SourcePortsContextType = {
        sourcePorts: sortedSourcePorts,
        knownSourcePorts: sortedKnownSourcePorts,
        defaultSourcePort,
        findSourcePortById,
        refetch,
      }

      return contextValue
    }, [data, refetch])

    return (
      <sourcePortsContext.Provider value={contextValue}>
        {props.children}
      </sourcePortsContext.Provider>
    )
  },
)

export const SourcePortsConsumer = sourcePortsContext.Consumer

export function useSourcePortsContext() {
  const context = useContext(sourcePortsContext)

  if (!context) {
    throw new Error(
      'useSourcePortsContext must be used within a SourcePortsProvider',
    )
  }

  return context
}
