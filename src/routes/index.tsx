import { AppBar, Box, Stack, Toolbar } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

import AppCogMenu from '#src/app/AppCogMenu'
import AppErrorComponent from '#src/app/AppErrorComponent'
import { AppToolbarProvider, AppToolbarSlot } from '#src/app/AppToolbarArea'
import OnboardingAlerts from '#src/app/OnboardingAlerts'
import {
  GetAppInfoDocument,
  InitializeAppDocument,
} from '#src/app/operations.generated'
import { GameDialogSuspense } from '#src/games/GameDialog'
import GameList from '#src/games/GameList'
import ImportDropZone from '#src/games/ImportDropZone'
import ImportQueueHandler from '#src/games/ImportQueueHandler'
import { GetGameListQueryDocument } from '#src/games/operations.generated'
import ModSetDialog from '#src/modSets/ModSetDialog'
import { ModSetsProvider } from '#src/modSets/modSetsContext'
import { GetAllModSetsDocument } from '#src/modSets/operations.generated'
import KnownSourcePortsDialog from '#src/sourcePorts/KnownSourcePortsDialog'
import { GetAllSourcePortsDocument } from '#src/sourcePorts/operations.generated'
import { SourcePortsProvider } from '#src/sourcePorts/sourcePortsContext'
import SourcePortsDialog from '#src/sourcePorts/SourcePortsDialog'
import TauriCliHandler from '#src/tauri/TauriCliHandler'

export const Route = createFileRoute('/')({
  loader: async ({ context: { apolloClient } }) => {
    // Must be called before anything else.
    await apolloClient.mutate({ mutation: InitializeAppDocument })

    // TODO Switch to useReadQuery?
    await Promise.all([
      apolloClient.query({ query: GetAllSourcePortsDocument }),
      apolloClient.query({ query: GetAllModSetsDocument }),
      apolloClient.query({ query: GetGameListQueryDocument }),
      apolloClient.query({ query: GetAppInfoDocument }),
    ])
  },
  // `initializeApp` only needs to run once. Apollo keeps the data fresh after
  // that.
  staleTime: Infinity,
  errorComponent: AppErrorComponent,
  component: App,
})

function App() {
  return (
    <SourcePortsProvider>
      <ModSetsProvider>
        <ImportDropZone>
          <AppToolbarProvider>
            <AppBar position="sticky">
              <Toolbar sx={{ gap: 2 }}>
                <AppToolbarSlot
                  renderSlot={(props) => {
                    return (
                      <Stack
                        spacing={2}
                        direction="row"
                        ref={props.ref}
                        sx={{
                          alignItems: 'center',
                        }}
                      />
                    )
                  }}
                />

                <Box
                  sx={{
                    flexGrow: '1',
                  }}
                />

                <AppCogMenu />
              </Toolbar>
            </AppBar>

            <OnboardingAlerts />

            <GameList />
          </AppToolbarProvider>
        </ImportDropZone>

        <GameDialogSuspense />

        <SourcePortsDialog />
        <KnownSourcePortsDialog />
        <ModSetDialog />
        <ImportQueueHandler />

        {/*
          Since some of the CLI args require the initializeApp mutation to be
          called, this has to live pretty deep in the app tree.
        */}
        <TauriCliHandler />
      </ModSetsProvider>
    </SourcePortsProvider>
  )
}
