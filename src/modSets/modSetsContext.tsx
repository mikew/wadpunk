import { useSuspenseQuery } from '@apollo/client/react'
import type { RefetchFunction } from '@apollo/client/react/internal'
import { createContext, memo, useContext, useMemo } from 'react'

import type { ModSet } from '#src/graphql/types'

import type {
  GetAllModSetsQuery,
  GetAllModSetsQueryVariables,
  ModSetDialogFieldsFragment,
} from './operations.generated'
import { GetAllModSetsDocument } from './operations.generated'

interface ModSetsContextType {
  modSets: ModSetDialogFieldsFragment[]
  findModSetByName: (
    name?: ModSet['name'] | null,
  ) => ModSetDialogFieldsFragment | undefined
  refetch: RefetchFunction<GetAllModSetsQuery, GetAllModSetsQueryVariables>
}

const modSetsContext = createContext<ModSetsContextType | undefined>(undefined)

export const ModSetsProvider: React.FC<React.PropsWithChildren> = memo(
  (props) => {
    const { data, refetch } = useSuspenseQuery(GetAllModSetsDocument)

    const contextValue = useMemo(() => {
      const sortedModSets = [...data.getModSets].sort((a, b) => {
        return a.name.localeCompare(b.name)
      })

      const findModSetByName = (name?: ModSet['name'] | null) => {
        if (!name || name === '-1') {
          return undefined
        }

        return data.getModSets.find((x) => x.name === name)
      }

      const contextValue: ModSetsContextType = {
        modSets: sortedModSets,
        findModSetByName,
        refetch,
      }

      return contextValue
    }, [data, refetch])

    return (
      <modSetsContext.Provider value={contextValue}>
        {props.children}
      </modSetsContext.Provider>
    )
  },
)

export const ModSetsConsumer = modSetsContext.Consumer

export function useModSetsContext() {
  const context = useContext(modSetsContext)

  if (!context) {
    throw new Error('useModSetsContext must be used within a ModSetsProvider')
  }

  return context
}
