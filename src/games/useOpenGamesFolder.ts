import { useMutation } from '@apollo/client'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'

import { OpenGamesFolderDocument } from '#src/graphql/operations'
import { useI18nContext } from '#src/i18n/lib/i18nContext'

function useOpenGamesFolder() {
  const [openGamesFolderMutation] = useMutation(OpenGamesFolderDocument)
  const { t } = useI18nContext()

  const openGamesFolder = useCallback(
    async (game_id?: string) => {
      try {
        const response = await openGamesFolderMutation({
          variables: {
            game_id,
          },
        })

        if (!response.data?.openGamesFolder) {
          enqueueSnackbar(t('games.notifications.openGamesFolderError'), {
            variant: 'error',
          })
        }
      } catch (err) {
        console.error(err)
      }
    },
    [openGamesFolderMutation, t],
  )

  return {
    openGamesFolder,
  }
}

export default useOpenGamesFolder
