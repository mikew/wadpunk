import { useMutation, useSuspenseQuery } from '@apollo/client'
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
  ModalDialog,
  CircularProgress,
} from '@mui/joy'
import { Suspense, useMemo } from 'react'
import { Form, useFormState } from 'react-final-form'

import {
  GetGameDialogFieldsDocument,
  GetGameDialogFieldsQuery,
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

const GameDialog: React.FC<{ game: GameListGame }> = (props) => {
  return (
    <Suspense
      fallback={
        <ModalDialog>
          <CircularProgress />
        </ModalDialog>
      }
    >
      <GameDialogInner game={props.game} />
    </Suspense>
  )
}

const GameDialogInner: React.FC<{
  game: GameListGame
}> = (props) => {
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
            <ModalDialogFinalForm minWidth={800}>
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

                <ModalClose />
              </DialogTitle>

              <DialogContent>
                <Grid spacing={2} container>
                  <Grid xs={12} sm={6}>
                    <Typography>{fullGame.description}</Typography>

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
                            <Autocomplete<
                              GetGameDialogFieldsQuery['getGames'][0],
                              true
                            >
                              {...input}
                              disabled={meta.submitting}
                              onChange={(_event, value) => {
                                input.onChange({
                                  target: {
                                    value: value.map((x) => x.id ?? x),
                                  },
                                })
                              }}
                              options={others}
                              getOptionLabel={(x) => {
                                return x.name ?? x
                              }}
                              isOptionEqualToValue={(option, value) => {
                                return option.id === value
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
  const [startGameMutation] = useMutation(StartGameDocument)
  const { files: allFiles } = useGameFileListContext()
  const formState = useFormState()

  return (
    <>
      <Button type="reset">Reset</Button>

      <Button
        onClick={async () => {
          try {
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

      <Button type="submit" color="neutral" disabled={formState.submitting}>
        Save
      </Button>
    </>
  )
}

export default GameDialog
