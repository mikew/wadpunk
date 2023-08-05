import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import typedInvoke from './tauri/typedInvoke'
import { useQuery } from 'urql'

const query = `
query demoQuery {
  list {
    id
    text
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
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
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
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  )
}

export default App
