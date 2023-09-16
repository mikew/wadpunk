import { useMutation } from '@apollo/client'
import { CircularProgress } from '@mui/joy'
import GameList from '@src/games/GameList'
import { InitializeAppDocument } from '@src/graphql/operations'
import { useEffect, useState } from 'react'

function App() {
  // TODO Can this be done with suspense? Might have to use a query to get easy
  // suspense ...
  const [isLoaded, setIsLoaded] = useState(false)
  const [initializeApp] = useMutation(InitializeAppDocument)

  useEffect(() => {
    async function run() {
      await initializeApp()
      setIsLoaded(true)
    }

    run()
  }, [initializeApp])

  return isLoaded ? (
    <GameList />
  ) : (
    <>
      <CircularProgress />
    </>
  )
}

export default App
