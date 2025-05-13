import { useMutation } from '@apollo/client'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import type { Game } from '#src/graphql/types'
import { useI18nContext } from '#src/i18n/lib/i18nContext'

import { StartGameDocument } from './operations.generated'

function useStartGame() {
  const { t } = useI18nContext()
  const [startGameMutation] = useMutation(StartGameDocument)

  const startGame = useCallback(
    async (gameId: Game['id']) => {
      try {
        const startGameResponse = await startGameMutation({
          variables: {
            game_id: gameId,
          },
        })

        invalidateApolloQuery(['getGames'])

        if (!startGameResponse.data?.startGame) {
          throw new Error('Error while running game')
        }
      } catch (err) {
        console.error('Failed to start game:', err)

        const message = err instanceof Error ? err.message : 'Unknown error'
        enqueueSnackbar(`${t('games.notifications.startError')}: ${message}`, {
          variant: 'error',
        })
      }
    },
    [startGameMutation, t],
  )

  return {
    startGame,
  }
}

export default useStartGame
