import { useSuspenseQuery } from '@apollo/client'
import {
  Checkbox,
  FormLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { useEffect } from 'react'
import { useWatch } from 'react-hook-form'

import { GetGameFilesDocument } from '#src/graphql/operations'

import type { GameDialogFormValues } from './GameDialog'
import type { FileEntry } from './GameFileListContext'
import { useGameFileListContext } from './GameFileListContext'
import isIwad from './isIwad'

// TODO:
// There's some issues with keeping this stuff in the form state.
// - The initial value is an empty array, so when the form is reset, the files
//   disappear.
// - We can't do the queries in the main component, because that would
//   reinitialize the form and lose any state the user has.
const GameDialogFileList: React.FC = (props) => {
  const { setFiles, files, setEnabled } = useGameFileListContext()
  const gameId = useWatch<GameDialogFormValues, 'id'>({
    name: 'id',
  })
  const iwadIdValue = useWatch<GameDialogFormValues, 'iwadId'>({
    name: 'iwadId',
  })
  const tagsField = useWatch<GameDialogFormValues, 'tags'>({ name: 'tags' })
  const extraGameIdsField = useWatch<GameDialogFormValues, 'extraGameIds'>({
    name: 'extraGameIds',
  })
  const isGameIwad = isIwad(tagsField)
  const iwadId = isGameIwad ? gameId : iwadIdValue

  const allGameIds = (isGameIwad ? [] : [gameId]).concat(
    extraGameIdsField.map((x) => (typeof x === 'string' ? x : x.id)),
  )

  const { data: gameFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: allGameIds,
    },
    fetchPolicy: 'network-only',
  })

  const { data: iwadFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: iwadId ? [iwadId] : [],
    },
    fetchPolicy: 'network-only',
  })

  useEffect(() => {
    const allFiles: FileEntry[] = [
      ...(iwadFiles.getGameFiles.map((x) => {
        const entry: FileEntry = {
          isIwad: true,
          absolute: x.absolute,
          relative: x.relative,
          selected:
            x.absolute.toLowerCase().endsWith('.wad') ||
            x.absolute.toLowerCase().endsWith('.pk3') ||
            x.absolute.toLowerCase().endsWith('.ipk3') ||
            x.absolute.toLowerCase().endsWith('.iwad'),
        }

        return entry
      }) || []),

      ...(gameFiles.getGameFiles.map((x) => {
        const entry: FileEntry = {
          isIwad: false,
          absolute: x.absolute,
          relative: x.relative,
          selected:
            x.absolute.toLowerCase().endsWith('.wad') ||
            x.absolute.toLowerCase().endsWith('.pk3') ||
            x.absolute.toLowerCase().endsWith('.ipk3') ||
            x.absolute.toLowerCase().endsWith('.iwad'),
        }

        return entry
      }) || []),
    ]

    setFiles(allFiles)

    // Trigger a resize so the iwad / mods dropdowns reposition themselves.
    window.dispatchEvent(new Event('resize'))
  }, [gameFiles.getGameFiles, iwadFiles.getGameFiles, setFiles])

  return (
    <>
      <FormLabel>Files</FormLabel>
      <List dense disablePadding>
        {files.map((x, i) => {
          return (
            <ListItem key={x.absolute} disableGutters disablePadding>
              <Checkbox
                size="small"
                checked={x.selected}
                onChange={(event) => {
                  setEnabled(x.relative, event.target.checked)
                }}
              />
              <ListItemText
                primary={x.relative}
                primaryTypographyProps={{
                  color: x.selected ? undefined : 'text.secondary',
                }}
              />
            </ListItem>
          )
        })}
      </List>
    </>
  )
}

export default GameDialogFileList
