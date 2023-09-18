import { useMutation, useQuery } from '@apollo/client'
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
  Autocomplete,
  Select,
  Option,
  Grid,
} from '@mui/joy'
import { forwardRef, useMemo } from 'react'
import { Form } from 'react-final-form'

import {
  GetGameListQueryDocument,
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

import GameDialogFileList from './GameDialogFileList'
import { type GameListGame } from './GameList'
import isIwad from './isIwad'
import useAllTags from './useAllTags'

export interface FileEntry {
  isIwad: boolean
  absolute: string
  relative: string
  selected: boolean
}

export interface GameDialogFormValues {
  id: Game['id']
  notes: Game['notes']
  rating: Game['rating']
  files: FileEntry[]
  tags: Game['tags']
  iwadId: Game['iwad_id']
  extraGameIds: (string | GameListGame)[]
}

const GameDialog = forwardRef<HTMLFormElement, { game: GameListGame }>(
  (props, ref) => {
    const [updateNotes] = useMutation(UpdateNotesDocument)
    const [setRating] = useMutation(SetRatingDocument)
    const [setTags] = useMutation(SetTagsDocument)
    const allTags = useAllTags()

    const [startGameMutation] = useMutation(StartGameDocument)

    const { data: games } = useQuery(GetGameListQueryDocument)
    const { iwads, others } = useMemo(() => {
      const iwads: GameListGame[] = []
      const others: GameListGame[] = []

      for (const game of games?.getGames || []) {
        if (isIwad(game.tags)) {
          iwads.push(game)
        } else if (game.id !== props.game.id) {
          others.push(game)
        }
      }

      return {
        iwads,
        others,
      }
    }, [games?.getGames, props.game.id])

    return (
      <Form<GameDialogFormValues>
        initialValues={{
          id: props.game.id,
          notes: props.game.notes,
          rating: props.game.rating,
          files: [],
          tags: props.game.tags,
          iwadId: props.game.iwad_id || '',
          extraGameIds: [],
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
          const isGameIwad = isIwad(values.tags)

          return (
            <ModalDialogFinalForm ref={ref} minWidth="800px" maxWidth="800px">
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
                <Grid spacing={2} container>
                  <Grid xs={12} sm={6}>
                    <Typography>{props.game.description}</Typography>

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
                                input.onChange({ target: { value } })
                              }}
                              options={allTags}
                              multiple
                            />
                          )
                        }}
                      />
                    </FormControl>

                    <FormControl disabled={isGameIwad}>
                      <FormLabel>IWAD</FormLabel>
                      <IdentityField
                        name="iwadId"
                        render={({ input, meta, ...rest }) => {
                          return (
                            <Select
                              value={isGameIwad ? values.id : input.value}
                              onChange={(_event, value) => {
                                input.onChange({ target: { value } })
                              }}
                            >
                              <Option value="">None</Option>

                              {iwads.map((x) => {
                                return (
                                  <Option key={x.id} value={x.id}>
                                    {x.name}
                                  </Option>
                                )
                              })}
                            </Select>
                          )
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Mods</FormLabel>
                      <IdentityField
                        name="extraGameIds"
                        render={({ input, meta, ...rest }) => {
                          return (
                            // Using autocomplete because there is no `multiple`
                            // on Select.
                            <Autocomplete<GameListGame, true>
                              {...input}
                              disabled={meta.submitting}
                              onChange={(_event, value) => {
                                input.onChange({ target: { value } })
                              }}
                              options={others}
                              getOptionLabel={(x) => x.name}
                              isOptionEqualToValue={(option, value) => {
                                return option.id === value.id
                              }}
                              multiple
                            />
                          )
                          // return (
                          //   <Select
                          //     value={isGameIwad ? values.id : input.value}
                          //     onChange={(_event, value) => {
                          //       input.onChange({ target: { value: [value] } })
                          //     }}
                          //   >
                          //     {others.map((x) => {
                          //       return (
                          //         <Option key={x.id} value={x.id}>
                          //           {x.name}
                          //         </Option>
                          //       )
                          //     })}
                          //   </Select>
                          // )
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
                  </Grid>

                  <Grid xs>
                    <GameDialogFileList />
                  </Grid>
                </Grid>
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
