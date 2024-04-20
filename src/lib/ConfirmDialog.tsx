import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import useLatest from './useLatest'

interface ConfirmDialogUiOptions {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}

const confirmDialogContext = createContext<{
  currentResolve: {
    current: (resolveFn: boolean | PromiseLike<boolean>) => void
  }
  setUi: (options: ConfirmDialogUiOptions) => void
  setIsOpen: (isOpen: boolean) => void

  isOpen: boolean
  ui: ConfirmDialogUiOptions
}>({
  currentResolve: { current: () => {} },
  setUi: () => {},
  setIsOpen: () => {},
  isOpen: false,
  ui: {},
})

export const ConfirmDialogProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [ui, setUi] = useState<ConfirmDialogUiOptions>({})
  const currentResolve = useRef<
    (resolveFn: boolean | PromiseLike<boolean>) => void
  >(() => {})

  return (
    <confirmDialogContext.Provider
      value={{
        currentResolve,
        setUi,
        setIsOpen,
        isOpen,
        ui,
      }}
    >
      {children}
    </confirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(confirmDialogContext)
  const contextRef = useLatest(context)

  useEffect(() => {
    const current = contextRef.current

    return () => {
      current.currentResolve.current(false)
      current.setIsOpen(false)
    }
  }, [contextRef])

  return {
    confirm: useCallback(
      (options: ConfirmDialogUiOptions) => {
        contextRef.current.setUi(options)
        contextRef.current.setIsOpen(true)

        return new Promise<boolean>((resolve) => {
          contextRef.current.currentResolve.current = resolve
        })
      },
      [contextRef],
    ),
  }
}

export const ConfirmDialog: React.FC = () => {
  const context = useContext(confirmDialogContext)

  return (
    <Dialog
      open={context.isOpen}
      onClose={() => {
        context.currentResolve.current(false)
        context.setIsOpen(false)
      }}
      TransitionProps={{
        onExited: () => {
          context.setUi({})
        },
      }}
    >
      <DialogTitle>{context.ui.title}</DialogTitle>

      <DialogContent>{context.ui.message}</DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            context.currentResolve.current(true)
            context.setIsOpen(false)
          }}
        >
          {context.ui.confirmLabel}
        </Button>

        <Button
          onClick={() => {
            context.currentResolve.current(false)
            context.setIsOpen(false)
          }}
        >
          {context.ui.cancelLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
