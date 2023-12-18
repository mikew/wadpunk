import { Close } from '@mui/icons-material'
import type { ButtonProps, DialogProps, IconButtonProps } from '@mui/material'
import { Button, Dialog, IconButton } from '@mui/material'
import type { ConsumerProps } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import useLatest from './useLatest'

type DelayedOnCloseDialogCloseReason =
  | 'backdropClick'
  | 'escapeKeyDown'
  | 'closeClick'

interface DelayedOnCloseDialogTriggerCloseContextType {
  (reason: DelayedOnCloseDialogCloseReason): void
}

const DelayedOnCloseDialogTriggerCloseContext =
  createContext<DelayedOnCloseDialogTriggerCloseContextType | null>(null)

export function useDelayedOnCloseDialogTriggerClose() {
  const context = useContext(DelayedOnCloseDialogTriggerCloseContext)

  if (!context) {
    throw new Error()
  }

  return context
}

export const DelayedOnCloseDialogTriggerCloseContextConsumer: React.FC<
  ConsumerProps<DelayedOnCloseDialogTriggerCloseContextType>
> = (props) => {
  const context = useContext(DelayedOnCloseDialogTriggerCloseContext)

  if (!context) {
    throw new Error()
  }

  return props.children(context)
}

interface DelayedOnCloseDialogProps extends Omit<DialogProps, 'onClose'> {
  onClose?: (event: unknown, reason: DelayedOnCloseDialogCloseReason) => void
  shouldClose?: (
    reason: DelayedOnCloseDialogCloseReason,
  ) => boolean | void | undefined | null
}

/** Dialog that calls onClose after the transitions has completed. */
const DelayedOnCloseDialog: React.FC<DelayedOnCloseDialogProps> = (props) => {
  const [isOpen, setIsOpen] = useState(props.open)

  useEffect(() => {
    setIsOpen(props.open)
  }, [props.open])

  const onCloseReasonRef =
    useRef<DelayedOnCloseDialogCloseReason>('backdropClick')

  const shouldCloseRef = useLatest(props.shouldClose)

  // Only using `useCallback` because this is the context value and there's no
  // need to cause re-renders.
  const triggerClose = useCallback(
    (reason: DelayedOnCloseDialogCloseReason) => {
      if (shouldCloseRef.current && !shouldCloseRef.current(reason)) {
        return
      }

      setIsOpen(false)
    },
    [shouldCloseRef],
  )

  return (
    <DelayedOnCloseDialogTriggerCloseContext.Provider value={triggerClose}>
      <Dialog
        {...props}
        TransitionProps={{
          ...props.TransitionProps,
          onExited: () => {
            props.onClose?.({}, onCloseReasonRef.current)
          },
        }}
        open={isOpen}
        onClose={(_event, reason) => {
          onCloseReasonRef.current = reason

          triggerClose(reason)
        }}
      />
    </DelayedOnCloseDialogTriggerCloseContext.Provider>
  )
}

export const DelayedOnCloseDialogCloseIcon: React.FC<
  Omit<IconButtonProps, 'onClick' | 'children'>
> = (props) => {
  const triggerClose = useDelayedOnCloseDialogTriggerClose()

  return (
    <IconButton
      {...props}
      onClick={() => {
        triggerClose('closeClick')
      }}
    >
      <Close />
    </IconButton>
  )
}

export const DelayedOnCloseDialogCloseButton: React.FC<
  Omit<ButtonProps, 'onClick'>
> = (props) => {
  const triggerClose = useDelayedOnCloseDialogTriggerClose()

  return (
    <Button
      {...props}
      onClick={() => {
        triggerClose('closeClick')
      }}
    />
  )
}

export default DelayedOnCloseDialog
