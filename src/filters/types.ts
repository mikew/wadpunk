import type {
  GetAllFiltersQuery,
  SaveFilterMutation,
} from './operations.generated'

export type FiltersListItem = ArrayItemType<GetAllFiltersQuery['getFilters']>
export type SaveFilterResponse = SaveFilterMutation['saveFilter']
