import { useState } from 'react'
import typedInvoke from './tauri/typedInvoke'
import { gql, useQuery } from 'urql'
import { Button } from '@mui/joy'

const query = gql`
  query demoQuery {
    getGames {
      id
      name

      play_sessions {
        duration
      }
    }
  }
`

function App() {
  const [{ data, fetching, stale, error }] = useQuery({
    query,
  })
  console.log({
    data,
    fetching,
    stale,
    error,
  })
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    try {
      const response = await typedInvoke('greet', { name })
      setGreetMsg(response)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="container">
      <ul>
        {data?.list?.map((x) => {
          return <li key={x.text}>{x.text}</li>
        })}
      </ul>

      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        {/* <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a> */}
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          greet()
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <Button type="submit">Greet</Button>
      </form>

      <p>{greetMsg}</p>
    </div>
  )
}

export default App
