import { useSuspenseQuery } from '@apollo/client/react'
import { Add, Download } from '@mui/icons-material'
import { Alert, AlertTitle, Button } from '@mui/material'

import { GetGameListQueryDocument } from '#src/games/operations.generated'
import Translate from '#src/i18n/Translate'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'
import { useSourcePortsContext } from '#src/sourcePorts/sourcePortsContext'

const OnboardingAlerts: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
  const { sourcePorts } = useSourcePortsContext()
  const dispatch = useRootDispatch()

  return (
    <>
      {sourcePorts.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>
            <Translate scope="sourcePorts.onboarding.noSourcePorts.title" />
          </AlertTitle>
          <Translate scope="sourcePorts.onboarding.noSourcePorts.message" />
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
            <Translate scope="sourcePorts.actions.addSourcePort" />
          </Button>
        </Alert>
      ) : undefined}

      {data.getGames.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>
            <Translate scope="games.onboarding.noGames.title" />
          </AlertTitle>
          <Translate scope="games.onboarding.noGames.message" />

          <ol>
            <li>
              <Translate scope="games.onboarding.noGames.step1" />
              <br />
              <br />
              <Button
                color="inherit"
                size="small"
                startIcon={<Download />}
                href="https://freedoom.github.io/download.html"
              >
                <Translate scope="games.onboarding.noGames.downloadFreedoom" />
              </Button>
              <br />
              <br />
            </li>
            <li>
              <Translate scope="games.onboarding.noGames.step2" />
            </li>
            <li>
              <Translate scope="games.onboarding.noGames.step3" />
            </li>
          </ol>
        </Alert>
      ) : undefined}
    </>
  )
}

export default OnboardingAlerts
