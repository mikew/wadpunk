import { useMutation, useSuspenseQuery } from '@apollo/client'
import {
  Button,
  FormControl,
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
  Box,
  Stack,
} from '@mui/material'
import { Suspense, useMemo } from 'react'
import { Form, useForm, useFormState } from 'react-final-form'

import FinalFormResetButton from '@src/final-form/FinalFormResetButton'
import FinalFormSubmitButton from '@src/final-form/FinalFormSubmitButton'
import IdentityField from '@src/final-form/IdentityField'
import TextareaField from '@src/final-form/TextareaField'
import {
  GetGameDialogFieldsDocument,
  GetGameDialogFieldsQuery,
  GetGameListQueryDocument,
  StartGameDocument,
  UpdateGameDocument,
} from '@src/graphql/operations'
import { Game } from '@src/graphql/types'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogCloseIcon,
  useDelayedOnCloseDialogTriggerClose,
} from '@src/lib/DelayedOnCloseDialog'
import StarRating from '@src/lib/StarRating'

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
  gameId: Game['id']
  open: boolean
  onClose: (event: {}, reason: string) => void
}

const GameDialog: React.FC<GameDialogProps> = (props) => {
  return (
    <Suspense
      fallback={
        <Dialog open={props.open}>
          <DialogContent>
            <Box padding={4} justifyContent="center">
              <CircularProgress />
            </Box>
          </DialogContent>
        </Dialog>
      }
    >
      <DelayedOnCloseDialog
        open={props.open}
        onClose={props.onClose}
        maxWidth="lg"
        fullWidth
      >
        <GameDialogInner gameId={props.gameId} onClose={props.onClose} />
      </DelayedOnCloseDialog>
    </Suspense>
  )
}

const GameDialogInner: React.FC<{
  gameId: GameDialogProps['gameId']
  onClose: GameDialogProps['onClose']
}> = (props) => {
  const allTags = useAllTags(true)
  const {
    data: { getGame: fullGame, getGames: games },
  } = useSuspenseQuery(GetGameDialogFieldsDocument, {
    variables: {
      game_id: props.gameId,
    },
  })

  const [updateGame] = useMutation(UpdateGameDocument)

  const { iwads, others } = useMemo(() => {
    const iwads: GetGameDialogFieldsQuery['getGames'] = []
    const others: GetGameDialogFieldsQuery['getGames'] = []

    for (const game of games || []) {
      if (isIwad(game.tags)) {
        iwads.push(game)
      } else if (game.id !== props.gameId) {
        others.push(game)
      }
    }

    return {
      iwads,
      others,
    }
  }, [games, props.gameId])

  return (
    <Form<GameDialogFormValues>
      initialValues={{
        id: props.gameId,
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
              id: props.gameId,
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
      {({ values, submitting }) => {
        const isGameIwad = isIwad(values.tags)

        return (
          <GameFileListProvider>
            <DialogTitle>
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing="space-between"
              >
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
                <div>
                  <DelayedOnCloseDialogCloseIcon />
                </div>
              </Stack>
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
                          openOnFocus
                          ChipProps={{ size: 'small' }}
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

                  <IdentityField
                    name="iwadId"
                    render={({ input, meta, ...rest }) => {
                      return (
                        <FormControl
                          disabled={isGameIwad || submitting}
                          error={meta.touched && meta.error}
                        >
                          <InputLabel>IWAD</InputLabel>
                          <Select
                            {...input}
                            value={isGameIwad ? values.id : input.value}
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
                        </FormControl>
                      )
                    }}
                  />

                  <IdentityField
                    name="extraGameIds"
                    render={({ input, meta, ...rest }) => {
                      return (
                        <FormControl>
                          <InputLabel>Mods</InputLabel>
                          <Select {...input} multiple disabled={submitting}>
                            {others.map((x) => {
                              return (
                                <MenuItem key={x.id} value={x.id}>
                                  {x.name}
                                </MenuItem>
                              )
                            })}
                          </Select>
                        </FormControl>
                      )
                    }}
                  />

                  <IdentityField
                    name="notes"
                    component={TextareaField}
                    disabled={submitting}
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
              <GameDialogActions game={fullGame} />
            </DialogActions>
          </GameFileListProvider>
        )
      }}
    </Form>
  )
}

const GameDialogActions: React.FC<{
  game: GetGameDialogFieldsQuery['getGame']
}> = (props) => {
  const [startGameMutation] = useMutation(StartGameDocument, {
    refetchQueries: [{ query: GetGameListQueryDocument }],
  })
  const { files: allFiles } = useGameFileListContext()
  const formState = useFormState()
  const form = useForm()

  return (
    <>
      <FinalFormResetButton color="warning">Reset</FinalFormResetButton>

      <FinalFormSubmitButton
        disabled={formState.submitting}
        onDidSave={() => {
          triggerClose('button')
        }}
      >
        Save
      </FinalFormSubmitButton>

      <Button
        variant="contained"
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
    </>
  )
}

export default GameDialog
