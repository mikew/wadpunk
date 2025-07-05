import { useMutation } from '@apollo/client'
import { listen } from '@tauri-apps/api/event'
import type { CliMatches } from '@tauri-apps/plugin-cli'
import { getMatches } from '@tauri-apps/plugin-cli'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect, useRef } from 'react'

import { ImportFileDocument } from '#src/app/operations.generated'
import { DownloadGameDocument } from '#src/games/operations.generated'
import { actions } from '#src/games/redux'
import useStartGame from '#src/games/useStartGame'
import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import useLatest from '#src/lib/useLatest'
import { useRootDispatch } from '#src/redux/helpers'

import type { WadpunkCliCommand } from './parseCli'
import { parseCliMatchesToCommand, parseUrlToCommand } from './parseCli'

function TauriCliHandler() {
  const { startGame } = useStartGame()
  const dispatch = useRootDispatch()
  const didHandleBoot = useRef(false)
  const [lol] = useMutation(DownloadGameDocument)
  const [importFile] = useMutation(ImportFileDocument)

  const handleCommand = useLatest(
    async (command: WadpunkCliCommand | undefined) => {
      if (!command) {
        return
      }

      switch (command.command) {
        case 'launch-game': {
          dispatch(actions.setSelectedId(command.gameId))
          startGame(command.gameId)

          break
        }

        case 'download-game': {
          console.log('Download game command received:', command)
          const { data } = await lol({
            variables: {
              host: command.host,
              hint: command.hint,
            },
          })

          await importFile({
            variables: {
              file_path: data?.downloadGame.temp_path,
            },
          })

          invalidateApolloQuery(['getGames'])

          break
        }

        default:
          console.warn('Unknown command:', command)
      }
    },
  )

  useEffect(() => {
    async function run() {
      if (didHandleBoot.current) {
        return
      }

      didHandleBoot.current = true

      const matches = await getMatches()
      const command = parseCliMatchesToCommand(matches, true)
      handleCommand.current(command)
    }

    run()

    return () => {
      didHandleBoot.current = true
    }
  }, [dispatch, handleCommand, startGame])

  useEffect(() => {
    let listening = true
    let unlisten: (() => void) | undefined = undefined

    async function run() {
      unlisten = await listen<CliMatches>('cli', async (event) => {
        if (!listening) {
          return
        }

        const command = parseCliMatchesToCommand(event.payload, true)
        handleCommand.current(command)
      })
    }

    run()

    return () => {
      listening = false
      unlisten?.()
    }
  }, [dispatch, handleCommand, startGame])

  useEffect(() => {
    let listening = true
    let unlisten: (() => void) | undefined = undefined

    async function run() {
      unlisten = await onOpenUrl(async (urls) => {
        if (!listening) {
          return
        }

        for (const url of urls) {
          const command = parseUrlToCommand(url)
          handleCommand.current(command)
        }
      })
    }

    run()

    return () => {
      listening = false
      unlisten?.()
    }
  }, [dispatch, handleCommand, startGame])

  return null
}

export default TauriCliHandler
