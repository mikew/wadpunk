import { gql, useMutation, useQuery } from 'urql'
import { Button, List, ListItem, ListItemContent } from '@mui/joy'
import { Mutation, Query } from './graphql'

const query = gql`
  query demoQuery {
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

function App() {
  const [{ data, fetching, stale, error }] = useQuery<Query>({
    query,
  })

  const [_, openGamesFolder] = useMutation<Mutation>(OPEN_GAMES_FOLDER)

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
                      const response = await openGamesFolder({
                        game_id: x.name,
                      })
                      console.log(response)
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
            console.log(response)
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
