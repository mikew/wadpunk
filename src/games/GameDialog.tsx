import { useMutation, useSuspenseQuery } from '@apollo/client'
import {
  Button,
  FormControl,
  // FormHelperText,
  FormLabel,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  Autocomplete,
  Select,
  MenuItem,
  Grid,
  Dialog,
  CircularProgress,
  TextField,
  InputLabel,
} from '@mui/material'
import { Suspense, useMemo } from 'react'
import { Form, useForm, useFormState } from 'react-final-form'

import {
  GetGameDialogFieldsDocument,
  GetGameDialogFieldsQuery,
  GetGameListQueryDocument,
  StartGameDocument,
  UpdateGameDocument,
} from '@src/graphql/operations'
import { Game } from '@src/graphql/types'
import IdentityField from '@src/lib/IdentityField'
import ModalDialogFinalForm from '@src/lib/ModalDialogFinalForm'
import StarRating from '@src/lib/StarRating'
import TextareaField from '@src/lib/TextareaField'

import GameDialogFileList from './GameDialogFileList'
import {
  GameFileListProvider,
  useGameFileListContext,
} from './GameFileListContext'
import { type GameListGame } from './GameList'
import isIwad from './isIwad'
import useAllTags from './useAllTags'

export interface GameDialogFormValues {
  id: Game['id']
  notes: Game['notes']
  rating: Game['rating']
  tags: Game['tags']
  iwadId: Game['iwad_id']
  extraGameIds: (string | GameListGame)[]
}

interface GameDialogProps {
  game: GameListGame
  onClose: (reason: string) => void
}

const GameDialog: React.FC<GameDialogProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Dialog open>
          <CircularProgress />
        </Dialog>
      }
    >
      <GameDialogInner game={props.game} onClose={props.onClose} />
    </Suspense>
  )
}

const GameDialogInner: React.FC<GameDialogProps> = (props) => {
  const allTags = useAllTags(true)
  const {
    data: { getGame: fullGame, getGames: games },
  } = useSuspenseQuery(GetGameDialogFieldsDocument, {
    variables: {
      game_id: props.game.id,
    },
  })

  const [updateGame] = useMutation(UpdateGameDocument)

  const { iwads, others } = useMemo(() => {
    const iwads: GetGameDialogFieldsQuery['getGames'] = []
    const others: GetGameDialogFieldsQuery['getGames'] = []

    for (const game of games || []) {
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
  }, [games, props.game.id])

  return (
    <Form<GameDialogFormValues>
      initialValues={{
        id: props.game.id,
        rating: fullGame.rating,
        // description: '',
        notes: fullGame.notes,
        tags: fullGame.tags,

        // sourcePortId: '',
        iwadId: fullGame.iwad_id || '',
        extraGameIds: fullGame.extra_mod_ids || [],
      }}
      onSubmit={async (values) => {
        await updateGame({
          variables: {
            game: {
              id: props.game.id,
              rating: values.rating,
              // description: values.description,
              notes: values.notes,
              tags: values.tags,

              // source_port: values.source_port_id,
              iwad_id: values.iwadId ? values.iwadId : null,
              extra_mod_ids: values.extraGameIds.map((x) =>
                typeof x === 'string' ? x : x.id,
              ),
              // enabled_files: values.enabledFiles,
            },
          },
        })
      }}
    >
      {({ values }) => {
        const isGameIwad = isIwad(values.tags)

        return (
          <GameFileListProvider>
            <ModalDialogFinalForm
              open
              onClose={props.onClose}
              maxWidth="lg"
              fullWidth
            >
              <DialogTitle>
                <div>
                  {fullGame.name}

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
              </DialogTitle>

              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>{fullGame.description}</Typography>

                    <IdentityField
                      name="tags"
                      render={({ input, meta, ...rest }) => {
                        return (
                          <Autocomplete<string, true, undefined, true>
                            {...input}
                            renderInput={(props) => (
                              <TextField {...props} label="Tags" />
                            )}
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

                    <FormControl disabled={isGameIwad}>
                      <InputLabel>IWAD</InputLabel>
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
                              <MenuItem value="">None</MenuItem>

                              {iwads.map((x) => {
                                return (
                                  <MenuItem key={x.id} value={x.id}>
                                    {x.name}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          )
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <InputLabel>Mods</InputLabel>
                      <IdentityField
                        name="extraGameIds"
                        render={({ input, meta, ...rest }) => {
                          return (
                            <Select {...input} multiple>
                              {others.map((x) => {
                                return (
                                  <MenuItem key={x.id} value={x.id}>
                                    {x.name}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          )
                        }}
                      />
                    </FormControl>

                    <IdentityField
                      name="notes"
                      component={TextareaField}
                      label="Notes"
                      multiline
                      minRows={2}
                      maxRows={8}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Suspense fallback={<CircularProgress />}>
                      <GameDialogFileList />
                    </Suspense>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions>
                <Lol game={fullGame} />
              </DialogActions>
            </ModalDialogFinalForm>
          </GameFileListProvider>
        )
      }}
    </Form>
  )
}

const Lol = (props) => {
  const [startGameMutation] = useMutation(StartGameDocument, {
    refetchQueries: [{ query: GetGameListQueryDocument }],
  })
  const { files: allFiles } = useGameFileListContext()
  const formState = useFormState()
  const form = useForm()

  return (
    <>
      <Button type="reset">Reset</Button>

      <Button
        onClick={async () => {
          try {
            await form.submit()

            const files: string[] = []
            let iwad: string | undefined = undefined

            for (const fileEntry of allFiles) {
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
        disabled={formState.submitting}
      >
        Play
      </Button>

      <Button type="submit" disabled={formState.submitting}>
        Save
      </Button>
    </>
  )
}

export default GameDialog
