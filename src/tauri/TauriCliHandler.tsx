import { getMatches } from '@tauri-apps/api/cli'
import { useEffect } from 'react'

import { actions } from '#src/games/redux'
import useStartGame from '#src/games/useStartGame'
import { useRootDispatch } from '#src/redux/helpers'

function TauriCliHandler() {
  const { startGame } = useStartGame()
  const dispatch = useRootDispatch()

  useEffect(() => {
    async function run() {
      const gameId = await getLaunchGameIdFromCli()

      if (!gameId) {
        return
      }

      dispatch(actions.setSelectedId(gameId))
      await startGame(gameId)
    }

    run()
  }, [dispatch, startGame])

  return null
}

async function getLaunchGameIdFromCli() {
  const matches = await getMatches()
  const launchGameCommand =
    matches.subcommand?.name === 'launch-game' ? matches.subcommand : null

  const gameId = launchGameCommand?.matches.args['game-id']?.value

  if (typeof gameId === 'string') {
    return gameId
  }
}

export default TauriCliHandler
