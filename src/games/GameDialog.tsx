import { useMutation, useQuery } from '@apollo/client'
import { Star, StarBorder } from '@mui/icons-material'
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
  Stack,
} from '@mui/joy'
import { forwardRef, useMemo } from 'react'
import { Form } from 'react-final-form'

import {
  GetGameFilesDocument,
  SetRatingDocument,
  UpdateNotesDocument,
} from '@src/graphql/operations'
import { Game } from '@src/graphql/types'
import IdentityField from '@src/lib/IdentityField'
import ModalDialogFinalForm from '@src/lib/ModalDialogFinalForm'
import TextareaField from '@src/lib/TextareaField'

import { type GameListGame } from './GameList'

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
}

const GameDialog = forwardRef<HTMLFormElement, { game: GameListGame }>(
  (props, ref) => {
    const iwad = 'Doom 2/'
    // const iwad = undefined

    const [updateNotes] = useMutation(UpdateNotesDocument)
    const [setRating] = useMutation(SetRatingDocument)
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
        }}
        onSubmit={async (values) => {
          await updateNotes({
            variables: {
              game_id: props.game.id,
              notes: values.notes,
            },
          })
        }}
      >
        {() => {
          return (
            <ModalDialogFinalForm ref={ref}>
              <DialogTitle>
                {props.game.name}
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
                  <FormLabel>Rating</FormLabel>
                  <IdentityField
                    name="rating"
                    render={({ input, meta, ...rest }) => {
                      return (
                        <Stack direction="row">
                          {[1, 2, 3, 4, 5].map((x) => {
                            const handleClick = () => {
                              setRating({
                                variables: {
                                  game_id: props.game.id,
                                  rating: x,
                                },
                              })
                            }

                            return input.value >= x ? (
                              <Star onClick={handleClick} />
                            ) : (
                              <StarBorder onClick={handleClick} />
                            )
                          })}
                        </Stack>
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

                <Button>Play</Button>

                <Button type="submit" color="neutral">
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
