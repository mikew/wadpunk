import { useSuspenseQuery } from '@apollo/client'
import {
  Checkbox,
  FormLabel,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { useEffect } from 'react'
import { useField } from 'react-final-form'

import { GetGameFilesDocument } from '@src/graphql/operations'

import { GameDialogFormValues } from './GameDialog'
import { FileEntry, useGameFileListContext } from './GameFileListContext'
import isIwad from './isIwad'

// TODO:
// There's some issues with keeping this stuff in the form state.
// - The initial value is an empty array, so when the form is reset, the files
//   disappear.
// - We can't do the queries in the main component, because that would
//   reinitialize the form and lose any state the user has.
const GameDialogFileList: React.FC = (props) => {
  const { setFiles, files, setEnabled } = useGameFileListContext()
  const gameId = useField<GameDialogFormValues['id']>('id')
  const {
    input: { value: iwadIdValue },
  } = useField<GameDialogFormValues['iwadId']>('iwadId', {
    subscription: { value: true },
  })
  const tagsField = useField<GameDialogFormValues['tags']>('tags', {
    subscription: { value: true },
  })
  const extraGameIdsField = useField<GameDialogFormValues['extraGameIds']>(
    'extraGameIds',
    {
      subscription: { value: true },
    },
  )
  const isGameIwad = isIwad(tagsField.input.value)
  const iwadId = isGameIwad ? gameId.input.value : iwadIdValue

  const allGameIds = (isGameIwad ? [] : [gameId.input.value]).concat(
    extraGameIdsField.input.value.map((x) =>
      typeof x === 'string' ? x : x.id,
    ),
  )

  const { data: gameFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: allGameIds,
    },
  })

  const { data: iwadFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: iwadId ? [iwadId] : [],
    },
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
