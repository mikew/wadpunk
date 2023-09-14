import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Modal,
  ModalClose,
  ModalDialog,
  Textarea,
  Typography,
} from '@mui/joy'
import { forwardRef, useMemo, useState } from 'react'
import { Game, Mutation, Query } from './graphql'
import PlayArrow from '@mui/icons-material/PlayArrow'
import FolderOpen from '@mui/icons-material/FolderOpen'

const INITIAL_QUERY = gql`
  query initialQuery {
    getGames {
      id
      name
      description
      notes
      tags
      rating

      play_sessions {
        duration
      }
    }

    getAppSettings {
      dataDirectory
    }
  }
`

const OPEN_GAMES_FOLDER = gql`
  mutation openGamesFolder($game_id: ID) {
    openGamesFolder(game_id: $game_id)
  }
`

const START_GAME = gql`
  mutation startGame($iwad: String, $files: [String!], $source_port: String!) {
    startGame(iwad: $iwad, files: $files, source_port: $source_port)
  }
`

const GET_GAME_FILES = gql`
  query getGameFiles($game_id: ID!) {
    getGameFiles(game_id: $game_id)
  }
`

const UPDATE_NOTES = gql`
  mutation updateNotes($game_id: ID!, $notes: String!) {
    updateNotes(game_id: $game_id, notes: $notes) {
      id
      notes
    }
  }
`

function App() {
  const { data } = useQuery<Query>(INITIAL_QUERY)

  const [openGamesFolderMutation] = useMutation<Mutation>(OPEN_GAMES_FOLDER)
  const [startGameMutation] = useMutation<Mutation>(START_GAME)
  const [getGameFilesMutation] = useLazyQuery<Query>(GET_GAME_FILES, {
    fetchPolicy: 'network-only',
  })
  const [selectedId, setSelectedId] = useState<Game['id']>()
  const selectedGame = useMemo(() => {
    return data?.getGames.find((x) => x.id === selectedId)
  }, [data?.getGames, selectedId])

  async function startGame(game: Game) {
    try {
      const getGameFilesResponse = await getGameFilesMutation({
        variables: {
          game_id: game.name,
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

const GameDialog = forwardRef<HTMLDivElement, { game: Game }>((props, ref) => {
  const [updateNotes] = useMutation<Mutation>(UPDATE_NOTES)

  return (
    <ModalDialog
      aria-labelledby="size-modal-title"
      aria-describedby="size-modal-description"
      size="sm"
      ref={ref}
    >
      <ModalClose />

      <Typography id="size-modal-title" level="h2">
        {props.game.name}
      </Typography>

      <Typography id="size-modal-description">
        {props.game.description}
      </Typography>

      <FormControl>
        <FormLabel>Notes</FormLabel>
        <Textarea minRows={2} value={props.game.notes} />
        <FormHelperText>This is a helper text.</FormHelperText>
      </FormControl>

      <Button
        onClick={() => {
          updateNotes({
            variables: {
              game_id: props.game.id,
              notes: 'updated from UI',
            },
          })
        }}
      >
        UPDATE_NOTES
      </Button>
    </ModalDialog>
  )
})

export default App
