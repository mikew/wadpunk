import { useSuspenseQuery } from '@apollo/client'
import { Edit, Extension } from '@mui/icons-material'
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
} from '@mui/material'
import { forwardRef, useImperativeHandle } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm } from 'react-hook-form'

import { useI18nContext } from '#src/i18n/lib/i18nContext'
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
  const { t } = useI18nContext()
  useImperativeHandle(ref, () => formApi, [formApi])
  const {
    data: { getGames: games },
  } = useSuspenseQuery(GetModSetsFormFieldsDocument)

  return (
    <FormProvider {...formApi}>
      <ReactHookFormTextField
        name="name"
        label={t('modSets.fields.name.label')}
        disabled={props.modSet.name !== ''}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Edit />
            </InputAdornment>
          ),
        }}
      />

      <ReactHookFormTextField
        name="mods"
        select
        SelectProps={{
          multiple: true,
        }}
        label={t('modSets.fields.mods.label')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Extension />
            </InputAdornment>
          ),
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
            {t('shared.delete')}
          </Button>
        )}

        <Box flexGrow={1} />

        <Button
          onClick={() => {
            formApi.reset()
          }}
        >
          {t('shared.reset')}
        </Button>

        <Button
          variant="contained"
          onClick={formApi.handleSubmit(async (values) => {
            await props.onClickSave(values, formApi)
          })}
        >
          {t('shared.save')}
        </Button>
      </Stack>
    </FormProvider>
  )
})

export default ModSetForm