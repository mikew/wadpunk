import { skipToken, useMutation, useQuery } from '@apollo/client'
import {
  Button,
  FormControl,
  // FormHelperText,
  FormLabel,
  ModalClose,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Checkbox,
  Autocomplete,
} from '@mui/joy'
import { forwardRef, useMemo } from 'react'
import { Form } from 'react-final-form'

import {
  GetGameFilesDocument,
  SetRatingDocument,
  SetTagsDocument,
  StartGameDocument,
  UpdateNotesDocument,
} from '@src/graphql/operations'
import { Game } from '@src/graphql/types'
import IdentityField from '@src/lib/IdentityField'
import ModalDialogFinalForm from '@src/lib/ModalDialogFinalForm'
import StarRating from '@src/lib/StarRating'
import TextareaField from '@src/lib/TextareaField'

import { type GameListGame } from './GameList'
import useAllTags from './useAllTags'

interface FileEntry {
  isIwad: boolean
  absolute: string
  relative: string
  selected: boolean
}

interface GameDialogFormValues {
  notes: Game['notes']
  rating: Game['rating']
  files: FileEntry[]
  tags: string[]
}

const GameDialog = forwardRef<HTMLFormElement, { game: GameListGame }>(
  (props, ref) => {
    const iwad = 'Doom 2/'
    // const iwad = undefined

    const [updateNotes] = useMutation(UpdateNotesDocument)
    const [setRating] = useMutation(SetRatingDocument)
    const [setTags] = useMutation(SetTagsDocument)
    const allTags = useAllTags()

    const { data: gameFiles } = useQuery(GetGameFilesDocument, {
      variables: {
        game_ids: [props.game.id],
      },
    })
    const { data: iwadFiles } = useQuery(GetGameFilesDocument, {
      variables: iwad
        ? {
            game_ids: [iwad],
          }
        : (skipToken as unknown as any),
    })

    const allFiles = useMemo(() => {
      const allFiles: FileEntry[] = [
        ...(iwadFiles?.getGameFiles.map((x) => {
          const wut: FileEntry = {
            isIwad: true,
            absolute: x.absolute,
            relative: x.relative,
            selected:
              x.absolute.toLowerCase().endsWith('.wad') ||
              x.absolute.toLowerCase().endsWith('pk3') ||
              x.absolute.toLowerCase().endsWith('.iwad'),
          }

          return wut
        }) || []),
        ...(gameFiles?.getGameFiles.map((x) => {
          const wut: FileEntry = {
            isIwad: false,
            absolute: x.absolute,
            relative: x.relative,
            selected:
              x.absolute.toLowerCase().endsWith('.wad') ||
              x.absolute.toLowerCase().endsWith('pk3') ||
              x.absolute.toLowerCase().endsWith('.iwad'),
          }

          return wut
        }) || []),
      ]

      return allFiles
    }, [gameFiles?.getGameFiles, iwadFiles?.getGameFiles])
    const [startGameMutation] = useMutation(StartGameDocument)

    return (
      <Form<GameDialogFormValues>
        initialValues={{
          notes: props.game.notes || '',
          rating: props.game.rating || 0,
          files: allFiles,
          tags: props.game.tags || [],
        }}
        onSubmit={async (values) => {
          await updateNotes({
            variables: {
              game_id: props.game.id,
              notes: values.notes,
            },
          })

          await setRating({
            variables: {
              game_id: props.game.id,
              rating: values.rating,
            },
          })

          await setTags({
            variables: {
              game_id: props.game.id,
              tags: values.tags,
            },
          })
        }}
      >
        {({ values, submitting }) => {
          return (
            <ModalDialogFinalForm ref={ref}>
              <DialogTitle>
                <div>
                  {props.game.name}

                  <IdentityField
                    name="rating"
                    render={({ input, meta, ...rest }) => {
                      return (
                        <StarRating
                          value={input.value}
                          onChange={(value) => {
                            if (meta.submitting) {
                              return
                            }

                            input.onChange({ target: { value } })
                          }}
                        />
                      )
                    }}
                  />
                </div>
                <ModalClose />
              </DialogTitle>

              <DialogContent>
                <Typography id="size-modal-description">
                  {props.game.description}
                </Typography>

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

                <FormControl>
                  <FormLabel>Tags</FormLabel>
                  <IdentityField
                    name="tags"
                    render={({ input, meta, ...rest }) => {
                      return (
                        <Autocomplete
                          {...input}
                          disabled={meta.submitting}
                          freeSolo
                          onChange={(_event, value) => {
                            console.log(value)
                            input.onChange({ target: { value } })
                          }}
                          options={allTags}
                          multiple
                        />
                      )
                    }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <IdentityField
                    name="notes"
                    component={TextareaField}
                    minRows={2}
                    maxRows={8}
                  />
                </FormControl>
              </DialogContent>

              <DialogActions>
                <Button type="reset">Reset</Button>

                <Button
                  onClick={async () => {
                    try {
                      const files: string[] = []
                      let iwad: string | undefined = undefined

                      for (const fileEntry of values.files) {
                        if (!fileEntry.selected) {
                          continue
                        }

                        if (fileEntry.isIwad) {
                          iwad = fileEntry.absolute
                        } else {
                          files.push(fileEntry.absolute)
                        }
                      }

                      const startGameResponse = await startGameMutation({
                        variables: {
                          game_id: props.game.id,
                          source_port:
                            '/Users/mike/Documents/GZDoom Launcher/SourcePorts/GZDoom.app/Contents/MacOS/gzdoom',
                          iwad,
                          files,
                        },
                      })

                      if (!startGameResponse.data?.startGame) {
                        throw new Error('startGame returned false')
                      }
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                  disabled={submitting}
                >
                  Play
                </Button>

                <Button type="submit" color="neutral" disabled={submitting}>
                  Save
                </Button>
              </DialogActions>
            </ModalDialogFinalForm>
          )
        }}
      </Form>
    )
  },
)

export default GameDialog
