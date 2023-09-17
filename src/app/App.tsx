import { FetchResult, useMutation } from '@apollo/client'
import { CircularProgress } from '@mui/joy'
import GameList from '@src/games/GameList'
import {
  InitializeAppDocument,
  InitializeAppMutation,
} from '@src/graphql/operations'
import { PropsWithChildren, Suspense, useEffect, useState } from 'react'

function App() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <Initializer>
        <GameList />
      </Initializer>
    </Suspense>
  )
}

function Initializer(props: PropsWithChildren<{}>) {
  const [initializeApp] = useMutation(InitializeAppDocument)
  // const [wrappedPromise] = useState(() => {
  //   return wrapPromiseForSuspense(initializeApp())
  // })
  const [wrappedPromise, setWrappedPromise] =
    useState<SuspenseWrappedPromise<FetchResult<InitializeAppMutation>>>()

  useEffect(() => {
    setWrappedPromise(wrapPromiseForSuspense(initializeApp()))
  }, [initializeApp])

  return (
    <>{wrappedPromise?.read()?.status === 'success' ? props.children : null}</>
  )
}

type WrappedPromiseStatus = 'pending' | 'success' | 'error'

interface SuspenseWrappedPromise<T> {
  read: () => { result: T; status: WrappedPromiseStatus } | undefined
}

function wrapPromiseForSuspense<T>(promise: Promise<T>) {
  let status: 'pending' | 'success' | 'error' = 'pending'
  let result: T
  let err: any

  const suspender = promise.then(
    (value) => {
      status = 'success'
      result = value
    },
    (e) => {
      status = 'error'
      err = e
    },
  )

  const wrappedPromise: SuspenseWrappedPromise<T> = {
    read() {
      if (status === 'pending') {
        throw suspender
      } else if (status === 'error') {
        throw err
      } else if (status === 'success') {
        return { status, result }
      }
    },
  }

  return wrappedPromise
}

export default App
