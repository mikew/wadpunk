import type {
  GetGameDialogFieldsQuery,
  GetGameListQueryQuery,
} from '#src/graphql/operations'

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>
export type GameDialogGame = GetGameDialogFieldsQuery['getGame']
