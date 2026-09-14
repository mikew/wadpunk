import type { CliMatches } from '@tauri-apps/plugin-cli'

export type WadpunkCliCommand =
  | {
      command: 'launch-game'
      gameId: string
    }
  | {
      command: 'download-game'
      host: 'idgames'
      hint?: string | null
    }

export function parseCliMatchesToCommand(
  matches: CliMatches,
  alsoHandleUrl = false,
) {
  if (alsoHandleUrl && matches.args['potential-url']?.value) {
    const url = matches.args['potential-url'].value

    if (typeof url === 'string') {
      return parseUrlToCommand(url)
    }
  }

  const subCommand = matches.subcommand?.name

  switch (subCommand) {
    case 'launch-game': {
      const gameId = matches.subcommand?.matches.args['game-id']?.value

      if (typeof gameId === 'string') {
        const command: WadpunkCliCommand = {
          command: 'launch-game',
          gameId,
        }

        return command
      }

      break
    }

    case 'download-game': {
      const host = matches.subcommand?.matches.args['host']?.value
      const hint = matches.subcommand?.matches.args['hint']?.value

      if (typeof host === 'string' && host === 'idgames') {
        const command: WadpunkCliCommand = {
          command: 'download-game',
          host,
          hint: typeof hint === 'string' ? hint : undefined,
        }

        return command
      }

      break
    }
  }
}

export function parseUrlToCommand(url: string) {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch (e) {
    console.warn('Failed to parse URL:', url, e)
    return
  }

  if (parsed.protocol !== 'wadpunk:' && parsed.protocol !== 'idgames:') {
    return
  }

  switch (parsed.host) {
    case 'launch-game': {
      const gameId = decodeURIComponent(parsed.pathname.slice(1))

      if (!gameId) {
        break
      }

      const command: WadpunkCliCommand = {
        command: 'launch-game',
        gameId,
      }

      return command
    }

    case 'download-game': {
      const host = parsed.pathname.replaceAll('/', '')

      // wadpunk://download-game/idgames/?hint=21234
      if (host === 'idgames') {
        const command: WadpunkCliCommand = {
          command: 'download-game',
          host,
          hint: parsed.searchParams.get('hint'),
        }

        return command
      }

      break
    }

    default: {
      // idgames://21691
      if (parsed.protocol === 'idgames:') {
        // Happy path: integer hostname makes it to the app as-is.
        if (parsed.host.match(/^\d+$/)) {
          const command: WadpunkCliCommand = {
            command: 'download-game',
            host: 'idgames',
            hint: parsed.host,
          }

          return command
        }

        // Unhappy path, integer hostname is passed to the app as an IP.
        if (parsed.host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          const command: WadpunkCliCommand = {
            command: 'download-game',
            host: 'idgames',
            hint: String(ipToNumber(parsed.host)),
          }

          return command
        }
      }

      break
    }
  }
}

function ipToNumber(ip: string) {
  const [part1 = 0, part2 = 0, part3 = 0, part4 = 0] = ip.split('.').map(Number)
  return (part1 << 24) + (part2 << 16) + (part3 << 8) + part4
}
