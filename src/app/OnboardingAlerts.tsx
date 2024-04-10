import { useSuspenseQuery } from '@apollo/client'
import { Add, Download } from '@mui/icons-material'
import { Alert, AlertTitle, Button } from '@mui/material'

import { GetGameListQueryDocument } from '#src/graphql/operations'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'
import useAllSourcePorts from '#src/sourcePorts/useAllSourcePorts'

const OnboardingAlerts: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
  const { sourcePorts } = useAllSourcePorts()
  const dispatch = useRootDispatch()

  return (
    <>
      {sourcePorts.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>No Source Ports found</AlertTitle>
          Source Ports are what WADPunk launches. You will need to add one
          before you can play any game.
          <br />
          <br />
          <Button
            color="inherit"
            size="small"
            startIcon={<Add />}
            onClick={() => {
              dispatch(actions.toggleDialog())
            }}
          >
            Add Source Port
          </Button>
        </Alert>
      ) : undefined}

      {data.getGames.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>No games found</AlertTitle>
          You will need to add some games to your library before you can launch
          anything. To quickly get started, you can:
          <ol>
            <li>
              If you don't have access Doom or Doom II, you can download
              Freedoom, which aims to provide all the content needed to form a
              complete game for the Doom engine.
              <br />
              <br />
              <Button
                color="inherit"
                size="small"
                startIcon={<Download />}
                href="https://freedoom.github.io/download.html"
                target="_blank"
              >
                Download "Freedoom: Phase 1+2"
              </Button>
              <br />
              <br />
            </li>
            <li>Extract Freedoom anywhere.</li>
            <li>Drag "freedoom1.wad" and "freedoom2.wad" into this window.</li>
          </ol>
        </Alert>
      ) : undefined}
    </>
  )
}

export default OnboardingAlerts
