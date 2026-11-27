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
import Translate from '#src/i18n/Translate'
import DelayedOnCloseDialog, {
  DelayedOnCloseDialogTitleWithCloseIcon,
} from '#src/mui/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import type { KnownSourcePortCardFieldsFragment } from './operations.generated'
import { useSourcePortsContext } from './sourcePortsContext'

const KnownSourcePortsDialog: React.FC = () => {
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
        <span>
          <Translate scope="knownSourcePorts.title" />
        </span>

        <DialogContentText>
          <Translate scope="knownSourcePorts.intro" />
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
  sourcePort: KnownSourcePortCardFieldsFragment
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

          <span>
            <Translate scope="knownSourcePorts.supportsCustomConfig" />
          </span>
        </Stack>

        <Stack
          spacing={1}
          direction="row"
          sx={{
            alignItems: 'center',
          }}
        >
          {props.sourcePort.supports_save_dir ? CHECK_MARK : WARNING_ICON}

          <span>
            <Translate scope="knownSourcePorts.supportsSaveDir" />
          </span>
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
          <Translate scope="knownSourcePorts.exampleCommand" />
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
          <Translate scope="knownSourcePorts.homePage" />
        </Button>

        <Button
          href={props.sourcePort.download_page_url}
          startIcon={<Download />}
          size="small"
        >
          <Translate scope="knownSourcePorts.download" />
        </Button>
      </AccordionActions>
    </Accordion>
  )
}

export default KnownSourcePortsDialog
