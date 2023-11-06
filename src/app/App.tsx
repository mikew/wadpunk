import { type FetchResult, useMutation } from '@apollo/client'
import { Box, CircularProgress } from '@mui/material'
import { type PropsWithChildren, Suspense, useEffect, useState } from 'react'

import GameList from '@src/games/GameList'
import {
  InitializeAppDocument,
  type InitializeAppMutation,
} from '@src/graphql/operations'
import {
  type SuspenseWrappedPromise,
  wrapPromiseForSuspense,
} from '@src/lib/wrapPromiseForSuspense'

function App() {
  return (
    <Suspense
      fallback={
        <Box padding={4} justifyContent="center">
          <CircularProgress />
        </Box>
      }
    >
      <Initializer>
        <GameList />
      </Initializer>
    </Suspense>
  )
}

function Initializer(props: PropsWithChildren) {
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
