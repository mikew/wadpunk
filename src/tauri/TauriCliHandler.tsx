import { listen } from '@tauri-apps/api/event'
import type { CliMatches } from '@tauri-apps/plugin-cli'
import { getMatches } from '@tauri-apps/plugin-cli'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect, useRef } from 'react'

import { actions } from '#src/games/redux'
import useStartGame from '#src/games/useStartGame'
import { useRootDispatch } from '#src/redux/helpers'

function TauriCliHandler() {
  const { startGame } = useStartGame()
  const dispatch = useRootDispatch()
  const didRun = useRef(false)

  useEffect(() => {
    async function run() {
      if (didRun.current) {
        return
      }

      didRun.current = true

      const matches = await getMatches()
      const gameId = getLaunchGameIdFromCli(matches)

      if (!gameId) {
        return
      }

      dispatch(actions.setSelectedId(gameId))
      await startGame(gameId)
    }

    run()

    return () => {
      didRun.current = true
    }
  }, [dispatch, startGame])

  useEffect(() => {
    let listening = true

    async function run() {
      await listen<CliMatches>('cli', async (event) => {
        if (!listening) {
          return
        }

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
      listening = false
    }
  }, [dispatch, startGame])

  useEffect(() => {
    let listening = true

    onOpenUrl(async (urls) => {
      if (!listening) {
        return
      }

      for (const url of urls) {
        const parsed = new URL(url)
        console.log(parsed)
        if (parsed.protocol !== 'wadpunk:') {
          continue
        }

        switch (parsed.host) {
          case 'launch-game': {
            const args = parsed.pathname.split('/').slice(1)
            const gameId = args[0]

            console.log(gameId)

            if (gameId) {
              dispatch(actions.setSelectedId(gameId))
              startGame(gameId)
            }
          }
        }
      }

      console.log(urls)
    })

    return () => {
      listening = false
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
