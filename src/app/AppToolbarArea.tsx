import { Box } from '@mui/material'
import { createContext, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

export const {
  reactContext: appToolbarContext,
  SlotComponent: AppToolbarSlot,
  PortalComponent: AppToolbarPortal,
  PortalProvider: AppToolbarProvider,
} = createSlotPortal({
  renderSlot(props) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
        ref={props.ref}
      />
    )
  },
})

function createSlotPortal<T extends HTMLElement = HTMLElement>(opts: {
  renderSlot: (props: {
    ref: (element: T | null) => void
  }) => React.ReactElement
}) {
  const reactContext = createContext<{
    setPortalRoot: (element: T | null) => void
    portalRoot: T | null
  } | null>(null)

  const PortalProvider: React.FC<React.PropsWithChildren> = (props) => {
    const [portalRoot, setPortalRoot] = useState<T | null>(null)
    const reactContextValue = useMemo(() => {
      return {
        setPortalRoot,
        portalRoot,
      }
    }, [portalRoot])

    return (
      <reactContext.Provider value={reactContextValue}>
        {props.children}
      </reactContext.Provider>
    )
  }

  const SlotComponent: React.FC = () => {
    const context = useContext(reactContext)

    if (!context) {
      return null
    }

    return opts.renderSlot({ ref: context.setPortalRoot })
  }

  const PortalComponent: React.FC<
    React.PropsWithChildren<{
      portalKey: string
    }>
  > = (props) => {
    const context = useContext(reactContext)

    return (
      <>
        {context?.portalRoot
          ? createPortal(
              <>{props.children}</>,
              context.portalRoot,
              props.portalKey,
            )
          : undefined}
      </>
    )
  }

  return {
    reactContext,
    SlotComponent,
    PortalComponent,
    PortalProvider,
  }
}
