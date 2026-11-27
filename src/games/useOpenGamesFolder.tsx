import { useMutation } from '@apollo/client/react'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'

import Translate from '#src/i18n/Translate'

import { OpenGamesFolderDocument } from './operations.generated'

function useOpenGamesFolder() {
  const [openGamesFolderMutation] = useMutation(OpenGamesFolderDocument)

  const openGamesFolder = useCallback(
    async (game_id?: string) => {
      try {
        const response = await openGamesFolderMutation({
          variables: {
            game_id,
          },
        })

        if (!response.data?.openGamesFolder) {
          enqueueSnackbar(
            <Translate scope="games.notifications.openGamesFolderError" />,
            {
              variant: 'error',
            },
          )
        }
      } catch (err) {
        console.error(err)
      }
    },
    [openGamesFolderMutation],
  )

  return {
    openGamesFolder,
  }
}

export default useOpenGamesFolder
