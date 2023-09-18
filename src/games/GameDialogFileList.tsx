import { skipToken, useQuery } from '@apollo/client'
import {
  Checkbox,
  FormLabel,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
} from '@mui/joy'
import { useEffect } from 'react'
import { useField } from 'react-final-form'

import { GetGameFilesDocument } from '@src/graphql/operations'
import IdentityField from '@src/lib/IdentityField'

import { FileEntry, GameDialogFormValues } from './GameDialog'
import isIwad from './isIwad'

// TODO:
// There's some issues with keeping this stuff in the form state.
// - The initial value is an empty array, so when the form is reset, the files
//   disappear.
// - We can't do the queries in the main component, because that would
//   reinitialize the form and lose any state the user has.
const GameDialogFileList: React.FC = (props) => {
  const {
    input: { onChange: filesOnChange },
  } = useField<GameDialogFormValues['files']>('files')
  const gameId = useField<GameDialogFormValues['id']>('id')
  // Only pulling this out because rules-of-hooks wants `files.input` instead of
  // `files.input.onChange`, which causes infinite loops.
  // Thank you, rules-of-hooks.
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

  const { data: gameFiles } = useQuery(GetGameFilesDocument, {
    variables: {
      game_ids:
        allGameIds.length === 0 ? (skipToken as unknown as any) : allGameIds,
    },
  })

  const { data: iwadFiles } = useQuery(GetGameFilesDocument, {
    variables: iwadId
      ? {
          game_ids: [iwadId],
        }
      : (skipToken as unknown as any),
  })

  useEffect(() => {
    const allFiles: FileEntry[] = [
      ...(iwadFiles?.getGameFiles.map((x) => {
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

      ...(gameFiles?.getGameFiles.map((x) => {
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

    filesOnChange({ target: { value: allFiles } })
  }, [filesOnChange, gameFiles?.getGameFiles, iwadFiles?.getGameFiles])

  return (
    <>
      <FormLabel>Files</FormLabel>
      <IdentityField<FileEntry[]>
        name="files"
        render={({ input, meta, ...rest }) => {
          return (
            <List size="sm" variant="outlined">
              {input.value.map((x, i) => {
                return (
                  <ListItem key={x.absolute}>
                    <ListItemDecorator>
                      <Checkbox
                        size="sm"
                        checked={x.selected}
                        onChange={(event) => {
                          if (meta.submitting) {
                            return
                          }

                          // TODO This would be pretty easy with
                          // Formik's `setIn` ...
                          const newValue = [...input.value]
                          newValue[i] = {
                            ...newValue[i],
                            selected: event.target.checked,
                          }

                          input.onChange({
                            target: {
                              value: newValue,
                            },
                          })
                        }}
                      />
                    </ListItemDecorator>
                    <ListItemContent>{x.relative}</ListItemContent>
                  </ListItem>
                )
              })}
            </List>
          )
        }}
      />
    </>
  )
}

export default GameDialogFileList
