import {
  Cancel,
  Check,
  Download,
  ExpandMore,
  OpenInNew,
} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  Dialog,
  DialogContent,
  Grid,
  Stack,
} from '@mui/material'
import { useState } from 'react'

import { useRootDispatch, useRootSelector } from '#src/redux/helpers'

import actions from './actions'
import type { KnownSourcePortListItem } from './types'
import useAllSourcePorts from './useAllSourcePorts'

const KnownSourcePortsDialog: React.FC = () => {
  const { knownSourcePorts } = useAllSourcePorts()
  const isOpen = useRootSelector(
    (state) => state.sourcePorts.isKnownSourcePortsDialogOpen,
  )
  const dispatch = useRootDispatch()

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        dispatch(actions.toggleKnownSourcePortsDialog())
      }}
    >
      <DialogContent>
        <Grid container spacing={2}>
          {knownSourcePorts.map((x) => {
            return (
              <Grid key={x.id} item xs={12}>
                <KnownSourcePortCard sourcePort={x} />
              </Grid>
            )
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  )
}

const CHECK_MARK = <Check color="success" fontSize="small" />
const WARNING_ICON = <Cancel color="warning" fontSize="small" />

const KnownSourcePortCard: React.FC<{ sourcePort: KnownSourcePortListItem }> = (
  props,
) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        title={props.sourcePort.name}
        subheader={props.sourcePort.description}
      />
      <CardContent>
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
            setIsExpanded(!isExpanded)
          }}
        >
          Example Command
        </Button>
        <Collapse in={isExpanded}>
          <code>{props.sourcePort.example_command.join(' ')}</code>
        </Collapse>
      </CardContent>

      <CardActions>
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
      </CardActions>
    </Card>
  )
}

export default KnownSourcePortsDialog
