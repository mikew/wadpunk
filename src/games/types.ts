import type {
  GetGameDialogFieldsQuery,
  GetGameListQueryQuery,
} from './operations.generated'

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>
export type GameDialogGame = GetGameDialogFieldsQuery['getGame']
