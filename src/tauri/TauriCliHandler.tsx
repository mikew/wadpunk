import { listen } from '@tauri-apps/api/event'
import type { CliMatches } from '@tauri-apps/plugin-cli'
import { getMatches } from '@tauri-apps/plugin-cli'
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link'
import { type } from '@tauri-apps/plugin-os'
import { useEffect, useRef } from 'react'

import { actions } from '#src/games/redux'
import useStartGame from '#src/games/useStartGame'
import useLatest from '#src/lib/useLatest'
import { useRootDispatch } from '#src/redux/helpers'

import type { WadpunkCliCommand } from './parseCli'
import { parseCliMatchesToCommand, parseUrlToCommand } from './parseCli'

function TauriCliHandler() {
  const { startGame } = useStartGame()
  const dispatch = useRootDispatch()
  const didHandleBoot = useRef(false)

  const handleCommand = useLatest((command: WadpunkCliCommand | undefined) => {
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
        dispatch(
          actions.addToImportQueue([
            {
              action: 'download',
              host: command.host,
              hint: command.hint,
            },
          ]),
        )

        break
      }

      default:
        console.warn('Unknown command:', command)
    }
  })

  useEffect(() => {
    let listening = true
    let unlistenCli: (() => void) | undefined = undefined
    let unlistenUrl: (() => void) | undefined = undefined

    async function run() {
      if (!didHandleBoot.current) {
        const matches = await getMatches()
        console.info('on launch cli matches:', matches)
        const command = parseCliMatchesToCommand(matches, true)
        handleCommand.current(command)

        if (type() === 'macos') {
          const urls = (await getCurrent()) || []

          console.info('on launch urls:', urls)

          for (const url of urls) {
            const command = parseUrlToCommand(url)
            handleCommand.current(command)
          }
        }
      }
      didHandleBoot.current = true

      unlistenCli = await listen<CliMatches>('cli', async (event) => {
        if (!listening) {
          return
        }

        console.info('cli while running:', event.payload)
        const command = parseCliMatchesToCommand(event.payload, true)
        handleCommand.current(command)
      })

      unlistenUrl = await onOpenUrl(async (urls) => {
        if (!listening) {
          return
        }

        console.info('onOpenUrl', urls)
        for (const url of urls) {
          const command = parseUrlToCommand(url)
          handleCommand.current(command)
        }
      })
    }

    run()

    return () => {
      didHandleBoot.current = true
      listening = false
      unlistenCli?.()
      unlistenUrl?.()
    }
  })

  return null
}

export default TauriCliHandler
