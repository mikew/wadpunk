import { Update } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
} from '@mui/material'
import getTextDecoration from '@mui/material/Link/getTextDecoration'
import { relaunch } from '@tauri-apps/api/process'
import type { UpdateResult } from '@tauri-apps/api/updater'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { parse } from 'marked'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useState } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

const TauriUpdateNotifier: React.FC = () => {
  const [isReleaseNotesDialogVisible, setIsReleaseNotesDialogVisible] =
    useState(false)
  const { t } = useI18nContext()
  const [status, setStatus] = useState<
    'INITIAL' | 'UPDATE_AVAILABLE' | 'UPDATING' | 'RESTART_REQUIRED'
  >('INITIAL')
  const [tauriUpdateResult, setTauriUpdateResult] =
    useState<UpdateResult | null>(null)

  useEffect(() => {
    async function run() {
      if (process.env.NODE_ENV === 'production') {
        const updateResult = await checkUpdate()

        if (updateResult.shouldUpdate) {
          setStatus('UPDATE_AVAILABLE')
          setTauriUpdateResult(updateResult)
        }
      }
    }

    run()
  }, [])

  const action = (
    <Stack direction="row" spacing={1}>
      {status === 'UPDATING' ? (
        <CircularProgress size={32} color="inherit" />
      ) : undefined}

      {status === 'RESTART_REQUIRED' ? (
        <Button
          color="inherit"
          size="small"
          onClick={async () => {
            await relaunch()
          }}
        >
          {t('updateNotifier.actions.relaunch')}
        </Button>
      ) : undefined}

      {status === 'UPDATE_AVAILABLE' ? (
        <Button
          color="inherit"
          size="small"
          onClick={async () => {
            try {
              setStatus('UPDATING')
              await installUpdate()
              setStatus('RESTART_REQUIRED')
            } catch (err) {
              console.error(err)
              enqueueSnackbar(
                t('updateNotifier.notifications.errorInstalling', {
                  error: String(err),
                }),
                {
                  variant: 'error',
                },
              )

              setStatus('UPDATE_AVAILABLE')
            }
          }}
        >
          {t('updateNotifier.actions.install')}
        </Button>
      ) : undefined}

      {status === 'UPDATE_AVAILABLE' || status === 'RESTART_REQUIRED' ? (
        <Button
          size="small"
          color="inherit"
          onClick={() => {
            setIsReleaseNotesDialogVisible(true)
          }}
        >
          {t('updateNotifier.actions.viewNotes')}
        </Button>
      ) : undefined}
    </Stack>
  )

  return (
    <>
      <Snackbar
        open={
          status === 'UPDATE_AVAILABLE' ||
          status === 'UPDATING' ||
          status === 'RESTART_REQUIRED'
        }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert severity="success" action={action} icon={<Update />}>
          {t('updateNotifier.notifications.updateAvailable', {
            version: tauriUpdateResult?.manifest?.version,
          })}
        </Alert>
      </Snackbar>

      <Dialog
        open={isReleaseNotesDialogVisible}
        fullWidth
        onClose={() => {
          setIsReleaseNotesDialogVisible(false)
        }}
      >
        <DialogTitle>
          {t('updateNotifier.releaseNotes.title', {
            version: tauriUpdateResult?.manifest?.version,
          })}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={(theme) => ({
              // Adapted from https://github.com/mui/material-ui/blob/v5.x/packages/mui-material/src/Link/Link.js
              '& a': {
                'color': 'primary.main',
                'textDecoration': 'underline',
                'textDecorationColor': getTextDecoration({
                  theme,
                  ownerState: { color: 'primary' },
                }),
                '&:hover': {
                  textDecorationColor: 'inherit',
                },
              },
            })}
            dangerouslySetInnerHTML={{
              __html: parse(tauriUpdateResult?.manifest?.body ?? ''),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TauriUpdateNotifier
