import {
  Cancel,
  Check,
  Download,
  ExpandMore,
  OpenInNew,
} from '@mui/icons-material'
import type { AccordionProps } from '@mui/material'
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  Collapse,
  DialogContent,
  DialogContentText,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogTitleWithCloseIcon,
} from '#src/mui/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import { useSourcePortsContext } from './sourcePortsContext'
import type { KnownSourcePortListItem } from './types'

const KnownSourcePortsDialog: React.FC = () => {
  const { t } = useI18nContext()
  const { knownSourcePorts } = useSourcePortsContext()
  const isOpen = useRootSelector(
    (state) => state.sourcePorts.isKnownSourcePortsDialogOpen,
  )
  const selectedIds = useRootSelector(
    (state) => state.sourcePorts.selectedKnownSourcePortIds,
  )
  const dispatch = useRootDispatch()

  return (
    <DelayedOnCloseDialog
      open={isOpen}
      onClose={() => {
        dispatch(actions.toggleKnownSourcePortsDialog())
      }}
    >
      <DelayedOnCloseDialogTitleWithCloseIcon>
        <span>{t('knownSourcePorts.title')}</span>

        <DialogContentText>
          {t('knownSourcePorts.intro')}
        </DialogContentText>
      </DelayedOnCloseDialogTitleWithCloseIcon>

      <DialogContent>
        {knownSourcePorts.map((x) => {
          return (
            <KnownSourcePortCard
              key={x.id}
              sourcePort={x}
              expanded={selectedIds.includes(x.id)}
              onChange={(event) => {
                dispatch(
                  actions.setSelectedKnownSourcePort({
                    ids: [x.id],
                    mode: 'toggle',
                  }),
                )
              }}
            />
          )
        })}
      </DialogContent>
    </DelayedOnCloseDialog>
  )
}

const CHECK_MARK = <Check color="success" fontSize="small" />
const WARNING_ICON = <Cancel color="warning" fontSize="small" />

interface KnownSourcePortCardProps extends Omit<AccordionProps, 'children'> {
  sourcePort: KnownSourcePortListItem
}

const KnownSourcePortCard: React.FC<KnownSourcePortCardProps> = (props) => {
  const { t } = useI18nContext()
  const { sourcePort, ...accordionProps } = props
  const [isExampleCommandExpanded, setIsExampleCommandExpanded] =
    useState(false)
  const description = t(
    `knownSourcePorts.info.${props.sourcePort.id}.description`,
    { defaultValue: '' },
  )

  return (
    <Accordion {...accordionProps}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {props.sourcePort.name}
      </AccordionSummary>

      <AccordionDetails>
        <Stack
          spacing={1}
          direction="row"
          sx={{
            alignItems: 'center',
          }}
        >
          {props.sourcePort.supports_custom_config ? CHECK_MARK : WARNING_ICON}

          <span>{t('knownSourcePorts.supportsCustomConfig')}</span>
        </Stack>

        <Stack
          spacing={1}
          direction="row"
          sx={{
            alignItems: 'center',
          }}
        >
          {props.sourcePort.supports_save_dir ? CHECK_MARK : WARNING_ICON}

          <span>{t('knownSourcePorts.supportsSaveDir')}</span>
        </Stack>

        {description ? (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              marginY: 2,
            }}
          >
            {description}
          </Typography>
        ) : undefined}

        <Button
          variant="text"
          fullWidth
          startIcon={<ExpandMore />}
          size="small"
          onClick={() => {
            setIsExampleCommandExpanded(!isExampleCommandExpanded)
          }}
        >
          {t('knownSourcePorts.exampleCommand')}
        </Button>
        <Collapse in={isExampleCommandExpanded}>
          <Typography variant="body2">
            <code>{props.sourcePort.example_command.join(' ')}</code>
          </Typography>
        </Collapse>
      </AccordionDetails>

      <AccordionActions>
        <Button
          href={props.sourcePort.home_page_url}
          startIcon={<OpenInNew />}
          size="small"
        >
          {t('knownSourcePorts.homePage')}
        </Button>

        <Button
          href={props.sourcePort.download_page_url}
          startIcon={<Download />}
          size="small"
        >
          {t('knownSourcePorts.download')}
        </Button>
      </AccordionActions>
    </Accordion>
  )
}

export default KnownSourcePortsDialog
