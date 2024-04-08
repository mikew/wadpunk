import { useMutation, useSuspenseQuery } from '@apollo/client'
import {
  Edit,
  Extension,
  Label,
  SportsEsports,
  Terminal,
} from '@mui/icons-material'
import {
  Button,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  Autocomplete,
  MenuItem,
  Grid,
  Dialog,
  CircularProgress,
  TextField,
  Box,
  Stack,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { Suspense, useMemo } from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormState,
} from 'react-hook-form'

import { invalidateApolloQuery } from '#src/graphql/graphqlClient'
import type { GetGameDialogFieldsQuery } from '#src/graphql/operations'
import {
  GetGameDialogFieldsDocument,
  StartGameDocument,
  UpdateGameDocument,
} from '#src/graphql/operations'
import type { Game } from '#src/graphql/types'
import pathWithoutExtension from '#src/lib/pathWithoutExtension'
import StarRating from '#src/lib/StarRating'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogCloseIcon,
  useDelayedOnCloseDialogTriggerClose,
} from '#src/mui/DelayedOnCloseDialog'
import ReactHookFormTextField from '#src/react-hook-form/ReactHookFormTextField'
import useAllSourcePorts from '#src/sourcePorts/useAllSourcePorts'

import GameDialogFileList from './GameDialogFileList'
import {
  GameFileListContext,
  GameFileListProvider,
  useGameFileListContext,
} from './GameFileListContext'
import type { GameListGame } from './GameList'
import isIwad from './isIwad'
import useAllTags from './useAllTags'

export interface GameDialogFormValues {
  id: Game['id']
  notes: Game['notes']
  rating: Game['rating']
  tags: Game['tags']
  iwadId: NonNullable<Game['iwad_id']>
  extraGameIds: (string | GameListGame)[]
  sourcePort: Game['source_port']
  useCustomConfig: Game['use_custom_config']
}

interface GameDialogProps {
  gameId: Game['id']
  open: boolean
  onClose: (event: unknown, reason: string) => void
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
    refetch,
  } = useSuspenseQuery(GetGameDialogFieldsDocument, {
    variables: {
      game_id: props.gameId,
    },
  })

  const { sourcePorts, defaultSourcePort } = useAllSourcePorts()

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

    iwads.sort((a, b) =>
      pathWithoutExtension(a.name).localeCompare(pathWithoutExtension(b.name)),
    )
    others.sort((a, b) =>
      pathWithoutExtension(a.name).localeCompare(pathWithoutExtension(b.name)),
    )

    return {
      iwads,
      others,
    }
  }, [games, props.gameId])

  const formApi = useForm<GameDialogFormValues>({
    defaultValues: {
      id: props.gameId,
      rating: fullGame.rating,
      // description: '',
      notes: fullGame.notes,
      tags: fullGame.tags,

      sourcePort: fullGame.source_port || '-1',
      iwadId: fullGame.iwad_id || '',
      extraGameIds: fullGame.extra_mod_ids || [],

      useCustomConfig: fullGame.use_custom_config || false,
    },
  })

  const tags = formApi.watch('tags')
  const isGameIwad = isIwad(tags)
  const iwadFieldHelperText = isGameIwad
    ? 'This game will be used as the IWAD.'
    : 'All games require an IWAD.'

  return (
    <FormProvider {...formApi}>
      <GameFileListProvider>
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <div>
              {fullGame.name}

              <Controller
                name="rating"
                render={(renderProps) => {
                  return (
                    <StarRating
                      value={renderProps.field.value}
                      onChange={(value) => {
                        if (renderProps.formState.isSubmitting) {
                          return
                        }

                        renderProps.field.onChange(value)
                      }}
                    />
                  )
                }}
              />
            </div>
            <div>
              <DelayedOnCloseDialogCloseIcon edge="end" />
            </div>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography>{fullGame.description}</Typography>

              <ReactHookFormTextField
                name="sourcePort"
                label="Source Port"
                select
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Terminal />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value={'-1'}>
                  <em>Default ({defaultSourcePort?.id})</em>
                </MenuItem>

                {sourcePorts.map((x) => {
                  return (
                    <MenuItem key={x.id} value={x.id}>
                      {x.id}
                    </MenuItem>
                  )
                })}
              </ReactHookFormTextField>

              <Controller
                name="useCustomConfig"
                render={({
                  field: { ref, value, ...field },
                  fieldState,
                  formState,
                }) => {
                  const isDisabled = formState.isSubmitting
                  const errorMessage = fieldState.error?.message

                  return (
                    <>
                      <FormControlLabel
                        inputRef={ref}
                        checked={value}
                        control={<Checkbox {...field} disabled={isDisabled} />}
                        label="Use Custom Config"
                      />
                      {errorMessage ? (
                        <FormHelperText error={fieldState.invalid}>
                          {errorMessage}
                        </FormHelperText>
                      ) : undefined}
                    </>
                  )
                }}
              />

              {/*
                  This field is a little tricky:

                  If the game is tagged with `iwad`, it gets disabled and the
                  value is forced to the current game id.

                  That latter part means we can't easily use `ReactHookFormTextField`
                  */}
              <Controller<GameDialogFormValues, 'iwadId'>
                name="iwadId"
                render={({
                  field: { ref, ...field },
                  fieldState,
                  formState,
                }) => {
                  const isDisabled = isGameIwad || formState.isSubmitting
                  const errorMessage = fieldState.error?.message

                  return (
                    <TextField
                      {...field}
                      inputRef={ref}
                      label="IWAD"
                      select
                      disabled={isDisabled}
                      error={fieldState.invalid}
                      value={isGameIwad ? fullGame.id : field.value}
                      helperText={errorMessage || iwadFieldHelperText}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SportsEsports />
                          </InputAdornment>
                        ),
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
                    </TextField>
                  )
                }}
              />

              <ReactHookFormTextField
                name="extraGameIds"
                select
                SelectProps={{
                  multiple: true,
                }}
                label="Mods"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Extension />
                    </InputAdornment>
                  ),
                }}
              >
                {others.map((x) => {
                  return (
                    <MenuItem key={x.id} value={x.id}>
                      {x.name}
                    </MenuItem>
                  )
                })}
              </ReactHookFormTextField>

              <Controller
                name="tags"
                render={({
                  field: { ref, onChange, ...field },
                  fieldState,
                  formState,
                }) => {
                  const isDisabled = formState.isSubmitting
                  const errorMessage = fieldState.error?.message

                  return (
                    <Autocomplete<string, true, undefined, true>
                      {...field}
                      openOnFocus
                      ChipProps={{ size: 'small' }}
                      renderInput={(props) => (
                        <TextField
                          {...props}
                          label="Tags"
                          inputRef={ref}
                          error={fieldState.invalid}
                          helperText={
                            errorMessage ||
                            'Tag a game with "iwad" to mark it as an IWAD.'
                          }
                          InputProps={{
                            ...props.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <Label />
                                </InputAdornment>
                                {props.InputProps.startAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiInputAdornment-positionStart': {
                              alignSelf: 'flex-start',
                            },
                            '& .MuiInputAdornment-positionStart .MuiSvgIcon-root':
                              {
                                marginLeft: '4px',
                              },
                          }}
                        />
                      )}
                      disabled={isDisabled}
                      freeSolo
                      onChange={(_event, value) => {
                        onChange(value)
                      }}
                      options={allTags}
                      multiple
                    />
                  )
                }}
              />

              <ReactHookFormTextField
                name="notes"
                label="Notes"
                multiline
                minRows={2}
                maxRows={8}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Edit sx={{ verticalAlign: 'middle' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputAdornment-positionStart': {
                    alignSelf: 'flex-start',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Suspense fallback={<CircularProgress />}>
                <GameDialogFileList
                  previousFileState={fullGame.previous_file_state}
                />
              </Suspense>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <GameFileListContext.Consumer>
            {(value) => {
              return (
                <GameDialogActions
                  game={fullGame}
                  submitForm={formApi.handleSubmit(async (values) => {
                    await updateGame({
                      variables: {
                        game: {
                          id: props.gameId,
                          rating: values.rating,
                          // description: values.description,
                          notes: values.notes,
                          tags: values.tags,

                          source_port: values.sourcePort,
                          iwad_id: values.iwadId ? values.iwadId : null,
                          extra_mod_ids: values.extraGameIds.map((x) =>
                            typeof x === 'string' ? x : x.id,
                          ),

                          previous_file_state: value?.files.map((x) => ({
                            absolute: x.absolute,
                            relative: x.relative,
                            is_enabled: x.selected,
                          })),

                          use_custom_config: values.useCustomConfig,
                        },
                      },
                    })

                    // Refetch game so we get the updated values.
                    await refetch()
                  })}
                  resetForm={() => {
                    formApi.reset()
                  }}
                />
              )
            }}
          </GameFileListContext.Consumer>
        </DialogActions>
      </GameFileListProvider>
    </FormProvider>
  )
}

const GameDialogActions: React.FC<{
  game: GetGameDialogFieldsQuery['getGame']
  resetForm: () => void
  submitForm: (event: React.BaseSyntheticEvent) => Promise<void>
}> = (props) => {
  const [startGameMutation] = useMutation(StartGameDocument)
  const { files: allFiles } = useGameFileListContext()
  const triggerClose = useDelayedOnCloseDialogTriggerClose()
  const formState = useFormState()
  const { findSourcePortById } = useAllSourcePorts()

  return (
    <>
      <Button
        color="warning"
        onClick={() => {
          props.resetForm()
        }}
      >
        Reset
      </Button>

      <Button
        onClick={(event) => {
          props.submitForm(event).then(() => {
            triggerClose('closeClick')
          })
        }}
      >
        Save
      </Button>

      <Button
        variant="contained"
        onClick={async (event) => {
          try {
            await props.submitForm(event)

            const sourcePort = findSourcePortById(props.game.source_port)

            if (!sourcePort) {
              enqueueSnackbar(
                `Could not find source port with id "${props.game.source_port}"`,
                { variant: 'error' },
              )
              return
            }

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
                source_port: sourcePort.id,
                iwad,
                files,
                use_custom_config: props.game.use_custom_config,
              },
            })

            invalidateApolloQuery(['getGames'])

            if (!startGameResponse.data?.startGame) {
              enqueueSnackbar('Looks like something went wrong when running', {
                variant: 'error',
              })
            }
          } catch (err) {
            console.error(err)
          }
        }}
        disabled={formState.isSubmitting || !formState.isValid}
      >
        Play
      </Button>
    </>
  )
}

export default GameDialog
