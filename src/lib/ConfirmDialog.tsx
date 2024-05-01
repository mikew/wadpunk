import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

import useLatest from './useLatest'

interface ConfirmDialogUiOptions {
  title?: React.ReactNode
  message?: React.ReactNode
  confirmLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
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

export const ConfirmDialogProvider: React.FC<React.PropsWithChildren> = memo(
  ({ children }) => {
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
  },
)

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

export const ConfirmDialog: React.FC = memo(() => {
  const context = useContext(confirmDialogContext)
  const { t } = useI18nContext()

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
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{context.ui.title || t('confirm.defaultTitle')}</DialogTitle>

      <DialogContent>
        {context.ui.message || t('confirm.defaultMessage')}
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            context.currentResolve.current(true)
            context.setIsOpen(false)
          }}
        >
          {context.ui.confirmLabel || t('shared.yes')}
        </Button>

        <Button
          onClick={() => {
            context.currentResolve.current(false)
            context.setIsOpen(false)
          }}
        >
          {context.ui.cancelLabel || t('shared.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  )
})
