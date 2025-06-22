import { listen } from '@tauri-apps/api/event'
import type { CliMatches } from '@tauri-apps/plugin-cli'
import { getMatches } from '@tauri-apps/plugin-cli'
import { useEffect } from 'react'

import { actions } from '#src/games/redux'
import useStartGame from '#src/games/useStartGame'
import { useRootDispatch } from '#src/redux/helpers'

function TauriCliHandler() {
  const { startGame } = useStartGame()
  const dispatch = useRootDispatch()

  useEffect(() => {
    async function run() {
      const matches = await getMatches()
      const gameId = getLaunchGameIdFromCli(matches)

      if (!gameId) {
        return
      }

      dispatch(actions.setSelectedId(gameId))
      await startGame(gameId)
    }

    run()
  }, [dispatch, startGame])

  useEffect(() => {
    let unlisten: () => void = () => { }

    async function run() {
      unlisten = await listen<CliMatches>('cli', async (event) => {
        const gameId = getLaunchGameIdFromCli(event.payload)

        if (!gameId) {
          return
        }

        dispatch(actions.setSelectedId(gameId))
        await startGame(gameId)
      })
    }

    run()

    return () => {
      unlisten()
    }
  }, [dispatch, startGame])

  return null
}

function getLaunchGameIdFromCli(matches: CliMatches) {
  const launchGameCommand =
    matches.subcommand?.name === 'launch-game' ? matches.subcommand : null

  const gameId = launchGameCommand?.matches.args['game-id']?.value

  if (typeof gameId === 'string') {
    return gameId
  }
}

export default TauriCliHandler
