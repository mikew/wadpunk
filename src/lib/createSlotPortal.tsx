import { createContext, memo, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

export type SlotPortalRenderSlotFunction = (props: {
  ref: (element: HTMLElement | null) => void
}) => React.ReactElement

function createSlotPortal() {
  const reactContext = createContext<{
    setPortalRoot: (element: HTMLElement | null) => void
    portalRoot: HTMLElement | null
  } | null>(null)

  const PortalProvider: React.FC<React.PropsWithChildren> = (props) => {
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
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

  const SlotComponent: React.FC<{
    renderSlot: SlotPortalRenderSlotFunction
  }> = (props) => {
    const context = useContext(reactContext)

    if (!context) {
      return null
    }

    return props.renderSlot({ ref: context.setPortalRoot })
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
    SlotComponent: memo(SlotComponent),
    PortalComponent: memo(PortalComponent),
    PortalProvider: memo(PortalProvider),
  }
}

export default createSlotPortal
