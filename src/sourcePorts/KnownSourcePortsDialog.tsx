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
} from '@mui/material'
import { useState } from 'react'

import DelayedOnCloseDialog, {
  DelayedOnCloseDialogTitleWithCloseIcon,
} from '#src/mui/DelayedOnCloseDialog'
import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import type { KnownSourcePortListItem } from './types'
import useAllSourcePorts from './useAllSourcePorts'

const KnownSourcePortsDialog: React.FC = () => {
  const { knownSourcePorts } = useAllSourcePorts()
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
        <span>Known Source Ports</span>

        <DialogContentText>
          WADPunk supports a number of Source Ports. Even if your favorite isn't
          listed, it might still work: check the Example Command, and if it
          looks similar to what you use, give it a try!
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
  const { sourcePort, ...accordionProps } = props
  const [isExampleCommandExpanded, setIsExampleCommandExpanded] =
    useState(false)

  return (
    <Accordion {...accordionProps}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {props.sourcePort.name}
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1} direction="row" alignItems="center">
          {props.sourcePort.supports_custom_config ? CHECK_MARK : WARNING_ICON}

          <span>Supports custom config</span>
        </Stack>

        <Stack spacing={1} direction="row" alignItems="center">
          {props.sourcePort.supports_save_dir ? CHECK_MARK : WARNING_ICON}

          <span>Supports save directory</span>
        </Stack>

        <Button
          variant="text"
          fullWidth
          startIcon={<ExpandMore />}
          onClick={() => {
            setIsExampleCommandExpanded(!isExampleCommandExpanded)
          }}
        >
          Example Command
        </Button>
        <Collapse in={isExampleCommandExpanded}>
          <code>{props.sourcePort.example_command.join(' ')}</code>
        </Collapse>
      </AccordionDetails>

      <AccordionActions>
        <Button
          href={props.sourcePort.home_page_url}
          target="_blank"
          startIcon={<OpenInNew />}
        >
          Home Page
        </Button>

        <Button
          href={props.sourcePort.download_page_url}
          target="_blank"
          startIcon={<Download />}
        >
          Download
        </Button>
      </AccordionActions>
    </Accordion>
  )
}

export default KnownSourcePortsDialog
