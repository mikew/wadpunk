import { Update } from '@mui/icons-material'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
} from '@mui/material'
import { relaunch } from '@tauri-apps/api/process'
import type { UpdateManifest } from '@tauri-apps/api/updater'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { parse } from 'marked'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useState } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

const TauriUpdateNotifier: React.FC = () => {
  const [shouldUpdate, setShouldUpdate] = useState(false)
  const [needsRestart, setNeedsRestart] = useState(false)
  const [updateManifest, setUpdateManifest] = useState<
    UpdateManifest | undefined
  >(undefined)
  const [isReleaseNotesDialogVisible, setIsReleaseNotesDialogVisible] =
    useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { t } = useI18nContext()

  useEffect(() => {
    async function run() {
      if (process.env.NODE_ENV === 'production') {
        const updateStatus = await checkUpdate()

        setShouldUpdate(updateStatus.shouldUpdate)
        setUpdateManifest(updateStatus.manifest)
      }
    }

    run()
  }, [])

  const action = isUpdating ? (
    <CircularProgress size={32} color="inherit" />
  ) : needsRestart ? (
    <Button
      color="inherit"
      size="small"
      onClick={async () => {
        await relaunch()
      }}
    >
      {t('updateNotifier.actions.relaunch')}
    </Button>
  ) : (
    <Stack direction="row" spacing={1}>
      <Button
        color="inherit"
        size="small"
        onClick={async () => {
          try {
            setIsUpdating(true)
            await installUpdate()
            setNeedsRestart(true)
            // await relaunch()
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
          }

          setIsUpdating(false)
        }}
      >
        {t('updateNotifier.actions.install')}
      </Button>

      <Button
        size="small"
        color="inherit"
        onClick={() => {
          setIsReleaseNotesDialogVisible(true)
        }}
      >
        {t('updateNotifier.actions.viewNotes')}
      </Button>
    </Stack>
  )

  return (
    <>
      <Snackbar
        open={shouldUpdate}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert severity="success" action={action} icon={<Update />}>
          {t('updateNotifier.notifications.updateAvailable', {
            version: updateManifest?.version,
          })}
        </Alert>
      </Snackbar>

      <Dialog
        open={isReleaseNotesDialogVisible}
        onClose={() => {
          setIsReleaseNotesDialogVisible(false)
        }}
      >
        <DialogTitle>
          {t('updateNotifier.releaseNotes.title', {
            version: updateManifest?.version,
          })}
        </DialogTitle>

        <DialogContent>
          <div
            // eslint-disable-next-line react/no-danger -- need to render markdown.
            dangerouslySetInnerHTML={{
              __html: parse(updateManifest?.body ?? ''),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TauriUpdateNotifier
