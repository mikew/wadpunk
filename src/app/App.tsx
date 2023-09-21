import { FetchResult, useMutation } from '@apollo/client'
import { CircularProgress } from '@mui/material'
import { PropsWithChildren, Suspense, useEffect, useState } from 'react'

import GameList from '@src/games/GameList'
import {
  InitializeAppDocument,
  InitializeAppMutation,
} from '@src/graphql/operations'
import {
  SuspenseWrappedPromise,
  wrapPromiseForSuspense,
} from '@src/lib/wrapPromiseForSuspense'

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
  const [wrappedPromise, setWrappedPromise] =
    useState<SuspenseWrappedPromise<FetchResult<InitializeAppMutation>>>()

  useEffect(() => {
    setWrappedPromise(wrapPromiseForSuspense(initializeApp()))
  }, [initializeApp])

  return (
    <>{wrappedPromise?.read()?.status === 'success' ? props.children : null}</>
  )
}

export default App
