import { useSuspenseQuery } from '@apollo/client'
import { Add, Download } from '@mui/icons-material'
import { Alert, AlertTitle, Button } from '@mui/material'

import { GetGameListQueryDocument } from '#src/games/operations.generated'
import { useI18nContext } from '#src/i18n/lib/i18nContext'
import { useRootDispatch } from '#src/redux/helpers'
import actions from '#src/sourcePorts/actions'
import { useSourcePortsContext } from '#src/sourcePorts/sourcePortsContext'

const OnboardingAlerts: React.FC = () => {
  const { data } = useSuspenseQuery(GetGameListQueryDocument)
  const { sourcePorts } = useSourcePortsContext()
  const dispatch = useRootDispatch()
  const { t } = useI18nContext()

  return (
    <>
      {sourcePorts.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>
            {t('sourcePorts.onboarding.noSourcePorts.title')}
          </AlertTitle>
          {t('sourcePorts.onboarding.noSourcePorts.message')}
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
            {t('sourcePorts.actions.addSourcePort')}
          </Button>
        </Alert>
      ) : undefined}

      {data.getGames.length === 0 ? (
        <Alert severity="warning" sx={{ margin: 2 }}>
          <AlertTitle>{t('games.onboarding.noGames.title')}</AlertTitle>
          {t('games.onboarding.noGames.message')}

          <ol>
            <li>
              {t('games.onboarding.noGames.step1')}
              <br />
              <br />
              <Button
                color="inherit"
                size="small"
                startIcon={<Download />}
                href="https://freedoom.github.io/download.html"
                target="_blank"
              >
                {t('games.onboarding.noGames.downloadFreedoom')}
              </Button>
              <br />
              <br />
            </li>
            <li>{t('games.onboarding.noGames.step2')}</li>
            <li>{t('games.onboarding.noGames.step3')}</li>
          </ol>
        </Alert>
      ) : undefined}
    </>
  )
}

export default OnboardingAlerts
