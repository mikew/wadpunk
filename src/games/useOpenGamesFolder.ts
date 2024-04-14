import { useMutation } from '@apollo/client'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'

import { OpenGamesFolderDocument } from '#src/graphql/operations'

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
          enqueueSnackbar('Could not open folder', { variant: 'error' })
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
