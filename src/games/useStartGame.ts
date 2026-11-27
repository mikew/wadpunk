import { useMutation } from '@apollo/client/react'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'

import { handleErrorLocallyContext } from '#src/graphql/context'
import type { Game } from '#src/graphql/types'
import useInvalidateApolloCache from '#src/graphql/useInvalidateApolloCache'
import { useI18nContext } from '#src/i18n/lib/i18nContext'

import { StartGameDocument } from './operations.generated'

function useStartGame() {
  const { t } = useI18nContext()
  const { invalidateApolloQuery } = useInvalidateApolloCache()
  const [startGameMutation] = useMutation(StartGameDocument)

  const startGame = useCallback(
    async (gameId: Game['id']) => {
      try {
        await startGameMutation({
          variables: {
            game_id: gameId,
          },
          context: handleErrorLocallyContext,
        })
      } catch (err) {
        console.error('Failed to start game:', err)

        const message =
          err instanceof Error
            ? err.message
            : t('games.notifications.unknownError')
        enqueueSnackbar(`${t('games.notifications.startError')}: ${message}`, {
          variant: 'error',
        })
      } finally {
        invalidateApolloQuery(['getGames'])
      }
    },
    [invalidateApolloQuery, startGameMutation, t],
  )

  return {
    startGame,
  }
}

export default useStartGame
