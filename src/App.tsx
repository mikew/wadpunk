import { gql, useMutation, useQuery } from 'urql'
import { Button, List, ListItem, ListItemContent } from '@mui/joy'
import { Mutation, Query } from './graphql'

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

function App() {
  const [{ data, fetching, stale, error }] = useQuery<Query>({
    query: INITIAL_QUERY,
  })

  const [, openGamesFolder] = useMutation<Mutation>(OPEN_GAMES_FOLDER)
  const [, startGame] = useMutation<Mutation>(START_GAME)
  const [, getGameFiles] = useQuery<Query>({
    query: GET_GAME_FILES,
    pause: true,
  })

  console.log({
    data,
    fetching,
    stale,
    error,
  })

  return (
    <>
      <List>
        {data?.getGames?.map((x) => {
          return (
            <ListItem key={x.id}>
              <ListItemContent>
                {x.name}

                <Button
                  onClick={async () => {
                    try {
                      const getGameFilesResponse = await getGameFiles({
                        id: x.name,
                      })

                      console.log(getGameFilesResponse.data)
                      // const startGameResponse = await startGame({
                      //   source_port: 'lol',
                      // })

                      // if (!startGameResponse.data?.startGame) {
                      //   throw new Error('startGame returned false')
                      // }
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                  size="sm"
                  variant="soft"
                  color="neutral"
                >
                  Play
                </Button>

                <Button
                  onClick={async () => {
                    try {
                      const response = await openGamesFolder({
                        game_id: x.name,
                      })

                      if (!response.data?.openGamesFolder) {
                        throw new Error('openGamesFolder returned false')
                      }
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                  size="sm"
                  variant="soft"
                  color="neutral"
                >
                  Open Games Folder
                </Button>
              </ListItemContent>
            </ListItem>
          )
        })}
      </List>

      <Button
        onClick={async () => {
          try {
            const response = await openGamesFolder()
          } catch (err) {
            console.error(err)
          }
        }}
      >
        Open Games Folder
      </Button>
    </>
  )
}

export default App
