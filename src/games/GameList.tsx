import { useMutation, useQuery } from '@apollo/client'
import FolderOpen from '@mui/icons-material/FolderOpen'
import PlayArrow from '@mui/icons-material/PlayArrow'
import {
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Modal,
  Stack,
} from '@mui/joy'
import { useMemo, useState } from 'react'

import {
  GetGameListQueryDocument,
  GetGameListQueryQuery,
  OpenGamesFolderDocument,
  SetRatingDocument,
  StartGameDocument,
} from '@src/graphql/operations'
import StarRating from '@src/lib/StarRating'

import GameDialog from './GameDialog'

type ArrayItemType<T> = T extends Array<infer A> ? A : never

export type GameListGame = ArrayItemType<GetGameListQueryQuery['getGames']>

const GameList: React.FC = () => {
  const { data } = useQuery(GetGameListQueryDocument)

  const [openGamesFolderMutation] = useMutation(OpenGamesFolderDocument)
  const [startGameMutation] = useMutation(StartGameDocument)
  const [setRating] = useMutation(SetRatingDocument)
  const [selectedId, setSelectedId] = useState<GameListGame['id']>()
  const selectedGame = useMemo(() => {
    return data?.getGames.find((x) => x.id === selectedId)
  }, [data?.getGames, selectedId])

  async function startGame(_game: GameListGame) {
    try {
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
                <Stack direction="row" spacing={1}>
                  <StarRating
                    value={x.rating}
                    onChange={(value) => {
                      setRating({
                        variables: {
                          game_id: x.id,
                          rating: value,
                        },
                      })
                    }}
                  />

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
                </Stack>
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

                  <Stack direction="row" spacing={1}>
                    {x.tags.map((tag) => {
                      return (
                        <Chip variant="outlined" key={tag}>
                          {tag}
                        </Chip>
                      )
                    })}
                  </Stack>
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
