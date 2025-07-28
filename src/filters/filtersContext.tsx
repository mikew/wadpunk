import { useMutation, useSuspenseQuery } from '@apollo/client'
import type { RefetchFunction } from '@apollo/client/react/hooks/useSuspenseQuery'
import { createContext, memo, useContext, useMemo } from 'react'

import type {
  GetAllFiltersQuery,
  GetAllFiltersQueryVariables,
} from './operations.generated'
import {
  GetAllFiltersDocument,
  SaveFilterDocument,
  DeleteFilterDocument,
} from './operations.generated'
import type { FiltersListItem, SaveFilterResponse } from './types'

interface FiltersContextType {
  filters: FiltersListItem[]
  findFilterByName: (name?: string | null) => FiltersListItem | undefined
  saveFilter: (name: string, contents: string) => Promise<SaveFilterResponse>
  deleteFilter: (name: string) => Promise<boolean>
  refetch: RefetchFunction<GetAllFiltersQuery, GetAllFiltersQueryVariables>
}

const filtersContext = createContext<FiltersContextType | undefined>(undefined)

export const FiltersProvider: React.FC<React.PropsWithChildren> = memo(
  (props) => {
    const { data, refetch } = useSuspenseQuery(GetAllFiltersDocument)

    const [saveFilterMutation] = useMutation(SaveFilterDocument, {
      refetchQueries: [GetAllFiltersDocument],
    })

    const [deleteFilterMutation] = useMutation(DeleteFilterDocument, {
      refetchQueries: [GetAllFiltersDocument],
    })

    const contextValue = useMemo(() => {
      const sortedFilters = [...data.getFilters].sort((a, b) => {
        return a.name.localeCompare(b.name)
      })

      const findFilterByName = (name?: string | null) => {
        if (!name) {
          return undefined
        }

        return data.getFilters.find((x) => x.name === name)
      }

      const saveFilter = async (name: string, contents: string) => {
        const result = await saveFilterMutation({
          variables: { name, contents },
        })

        if (!result.data?.saveFilter) {
          throw new Error('Failed to save filter')
        }

        return result.data.saveFilter
      }

      const deleteFilter = async (name: string) => {
        const result = await deleteFilterMutation({
          variables: { name },
        })

        return result.data?.deleteFilter ?? false
      }

      const contextValue: FiltersContextType = {
        filters: sortedFilters,
        findFilterByName,
        saveFilter,
        deleteFilter,
        refetch,
      }

      return contextValue
    }, [data, refetch, saveFilterMutation, deleteFilterMutation])

    return (
      <filtersContext.Provider value={contextValue}>
        {props.children}
      </filtersContext.Provider>
    )
  },
)

export const FiltersConsumer = filtersContext.Consumer

export function useFiltersContext() {
  const context = useContext(filtersContext)

  if (!context) {
    throw new Error('useFiltersContext must be used within a FiltersProvider')
  }

  return context
}
