import { Edit, Terminal } from '@mui/icons-material'
import {
  Box,
  Button,
  InputAdornment,
  Link,
  MenuItem,
  Stack,
} from '@mui/material'
import { forwardRef, useImperativeHandle } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm } from 'react-hook-form'

import { useI18nContext } from '#src/i18n/lib/i18nContext'
import ReactHookFormTextField from '#src/react-hook-form/ReactHookFormTextField'
import { useRootDispatch } from '#src/redux/helpers'

import actions from './actions'
import useAllSourcePorts from './useAllSourcePorts'

export interface AddSourcePortFormValues {
  id: string
  command: string
  known_source_port_id: string
}

const SourcePortForm = forwardRef<
  UseFormReturn<AddSourcePortFormValues>,
  {
    sourcePort: AddSourcePortFormValues
    onClickSave: (
      values: AddSourcePortFormValues,
      formApi: UseFormReturn<AddSourcePortFormValues>,
    ) => Promise<void>
    onDeleteClick?: () => void
  }
>((props, ref) => {
  const formApi = useForm<AddSourcePortFormValues>({
    defaultValues: props.sourcePort,
  })
  const { t } = useI18nContext()
  useImperativeHandle(ref, () => formApi, [formApi])
  const { knownSourcePorts } = useAllSourcePorts()
  const dispatch = useRootDispatch()
  const knownSourcePortId = formApi.watch('known_source_port_id')

  return (
    <FormProvider {...formApi}>
      <Stack spacing={2} direction="row">
        <ReactHookFormTextField
          name="id"
          label={t('sourcePorts.fields.id.label')}
          disabled={props.sourcePort.id !== ''}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Edit />
              </InputAdornment>
            ),
          }}
        />

        <ReactHookFormTextField
          name="known_source_port_id"
          label="Type"
          select
          sx={{ flex: '0 0 200px' }}
          helperText={
            <>
              <Link
                onClick={() => {
                  dispatch(
                    actions.setSelectedKnownSourcePort({
                      ids: [knownSourcePortId],
                      mode: 'exclusive',
                    }),
                  )
                  dispatch(actions.toggleKnownSourcePortsDialog())
                }}
              >
                More Info
              </Link>
            </>
          }
        >
          {knownSourcePorts.map((sourcePort) => {
            return (
              <MenuItem key={sourcePort.id} value={sourcePort.id}>
                {sourcePort.name}
              </MenuItem>
            )
          })}
        </ReactHookFormTextField>
      </Stack>

      <ReactHookFormTextField
        name="command"
        label={t('sourcePorts.fields.command.label')}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Terminal fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Stack direction="row" spacing={1}>
        {props.sourcePort.id === '' ? undefined : (
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

export default SourcePortForm
