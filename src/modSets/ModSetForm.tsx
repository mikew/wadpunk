import { useSuspenseQuery } from '@apollo/client/react'
import Edit from '@mui/icons-material/Edit'
import Extension from '@mui/icons-material/Extension'
import { Box, Button, InputAdornment, MenuItem, Stack } from '@mui/material'
import { forwardRef, useImperativeHandle } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm } from 'react-hook-form'

import Translate from '#src/i18n/Translate'
import ReactHookFormTextField from '#src/react-hook-form/ReactHookFormTextField'

import { GetModSetsFormFieldsDocument } from './operations.generated'

export interface AddModSetFormValues {
  name: string
  mods: string[]
}

const ModSetForm = forwardRef<
  UseFormReturn<AddModSetFormValues>,
  {
    modSet: AddModSetFormValues
    onClickSave: (
      values: AddModSetFormValues,
      formApi: UseFormReturn<AddModSetFormValues>,
    ) => Promise<void>
    onDeleteClick?: () => void
  }
>((props, ref) => {
  const formApi = useForm<AddModSetFormValues>({
    defaultValues: props.modSet,
  })
  useImperativeHandle(ref, () => formApi, [formApi])
  const {
    data: { getGames: games },
  } = useSuspenseQuery(GetModSetsFormFieldsDocument)

  return (
    <FormProvider {...formApi}>
      <ReactHookFormTextField
        name="name"
        label={<Translate scope="modSets.fields.name.label" />}
        disabled={props.modSet.name !== ''}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Edit />
              </InputAdornment>
            ),
          },
        }}
      />

      <ReactHookFormTextField
        name="mods"
        select
        label={<Translate scope="modSets.fields.mods.label" />}
        slotProps={{
          select: {
            multiple: true,
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Extension />
              </InputAdornment>
            ),
          },
        }}
      >
        {games.map((game) => {
          return (
            <MenuItem key={game.id} value={game.id}>
              {game.name}
            </MenuItem>
          )
        })}
      </ReactHookFormTextField>

      <Stack direction="row" spacing={1}>
        {props.modSet.name === '' ? undefined : (
          <Button
            color="error"
            variant="contained"
            onClick={props.onDeleteClick}
          >
            <Translate scope="shared.delete" />
          </Button>
        )}

        <Box
          sx={{
            flexGrow: 1,
          }}
        />

        <Button
          onClick={() => {
            formApi.reset()
          }}
        >
          <Translate scope="shared.reset" />
        </Button>

        <Button
          variant="contained"
          onClick={formApi.handleSubmit(async (values) => {
            await props.onClickSave(values, formApi)
          })}
        >
          <Translate scope="shared.save" />
        </Button>
      </Stack>
    </FormProvider>
  )
})

export default ModSetForm
