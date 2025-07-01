import type { CliMatches } from '@tauri-apps/plugin-cli'

export type WadpunkCliCommand = {
  command: 'launch-game'
  gameId: string
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

  if (parsed.protocol !== 'wadpunk:') {
    return
  }

  switch (parsed.host) {
    case 'launch-game': {
      const gameId = decodeURIComponent(parsed.pathname.slice(1))

      if (!gameId) {
        return
      }

      const command: WadpunkCliCommand = {
        command: 'launch-game',
        gameId,
      }

      return command
    }

    default:
      return
  }
}
