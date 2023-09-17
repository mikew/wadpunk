import { useLazyQuery, useMutation, useQuery } from '@apollo/client'
import FolderOpen from '@mui/icons-material/FolderOpen'
import PlayArrow from '@mui/icons-material/PlayArrow'
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Modal,
} from '@mui/joy'
import {
  GetGameFilesDocument,
  GetGameListQueryDocument,
  GetGameListQueryQuery,
  OpenGamesFolderDocument,
  StartGameDocument,
} from '@src/graphql/operations'
import { useMemo, useState } from 'react'
import GameDialog from './GameDialog'

type ArrayItemType<T> = T extends Array<infer A> ? A : never

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>

const GameList: React.FC = () => {
  const { data } = useQuery(GetGameListQueryDocument)

  const [openGamesFolderMutation] = useMutation(OpenGamesFolderDocument)
  const [startGameMutation] = useMutation(StartGameDocument)
  const [getGameFilesMutation] = useLazyQuery(GetGameFilesDocument, {
    fetchPolicy: 'network-only',
  })
  const [selectedId, setSelectedId] = useState<GameListGame['id']>()
  const selectedGame = useMemo(() => {
    return data?.getGames.find((x) => x.id === selectedId)
  }, [data?.getGames, selectedId])

  async function startGame(game: GameListGame) {
    try {
      const getGameFilesResponse = await getGameFilesMutation({
        variables: {
          game_ids: [game.id],
        },
      })

      const startGameResponse = await startGameMutation({
        variables: {
          source_port:
            '/Users/mike/Downloads/gzdoom-4-10-0-macOS/GZDoom.app/Contents/MacOS/gzdoom',
          iwad: '/Users/mike/Downloads/DOOM2.WAD',
          files: [
            '/Users/mike/Documents/GZDoom Launcher/Games/GoldenSouls2_1.4/GoldenSouls2_1.4.pk3',
          ],
        },
      })

      if (!startGameResponse.data?.startGame) {
        throw new Error('startGame returned false')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function openGamesFolder(game_id?: string) {
    try {
      const response = await openGamesFolderMutation({
        variables: {
          game_id,
        },
      })

      if (!response.data?.openGamesFolder) {
        throw new Error('openGamesFolder returned false')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <List>
        {data?.getGames?.map((x) => {
          return (
            <ListItem
              key={x.id}
              endAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => {
                      startGame(x)
                    }}
                    size="sm"
                    color="neutral"
                  >
                    <PlayArrow />
                  </IconButton>

                  <IconButton
                    onClick={() => {
                      openGamesFolder(x.id)
                    }}
                    size="sm"
                    color="neutral"
                  >
                    <FolderOpen />
                  </IconButton>
                </Box>
              }
            >
              <ListItemButton
                onClick={() => {
                  setSelectedId(x.id)
                }}
              >
                <ListItemContent>
                  {x.name}
                  {x.notes}
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Button
        onClick={() => {
          openGamesFolder()
        }}
        startDecorator={<FolderOpen />}
      >
        Open Games Folder
      </Button>

      <Modal open={!!selectedGame} onClose={() => setSelectedId(undefined)}>
        {selectedGame ? <GameDialog game={selectedGame} /> : <></>}
      </Modal>
    </>
  )
}

export default GameList
