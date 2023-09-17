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

interface GameDialogFormValues {
  notes: Game['notes']
  rating: Game['rating']
}

const GameDialog = forwardRef<HTMLFormElement, { game: GameListGame }>(
  (props, ref) => {
    const iwad = 'Doom 2/'
    // const iwad = undefined

    const game_ids = useMemo(() => {
      const ids = [props.game.id]

      if (iwad) {
        ids.unshift(iwad)
      }

      return ids
    }, [iwad, props.game.id])

    const [updateNotes] = useMutation(UpdateNotesDocument)
    const [setRating] = useMutation(SetRatingDocument)
    const { data: gameFiles } = useQuery(GetGameFilesDocument, {
      variables: {
        game_ids,
      },
    })

    return (
      <Form<GameDialogFormValues>
        initialValues={{
          notes: props.game.notes || '',
          rating: props.game.rating || 0,
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
                <List size="sm" variant="outlined">
                  {gameFiles?.getGameFiles.map((x) => {
                    return (
                      <ListItem key={x}>
                        <ListItemDecorator>
                          <Checkbox
                            size="sm"
                            checked={
                              x.toLowerCase().endsWith('.wad') ||
                              x.toLowerCase().endsWith('pk3') ||
                              x.toLowerCase().endsWith('.iwad')
                            }
                          />
                        </ListItemDecorator>
                        <ListItemContent>{x}</ListItemContent>
                      </ListItem>
                    )
                  })}
                </List>

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
