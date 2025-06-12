import type { Event } from '@tauri-apps/api/event'
import { TauriEvent, listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'

import useLatest from '#src/lib/useLatest'

function useTauriFileDrop(callback: (event: Event<string[]>) => void) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const callbackRef = useLatest(callback)

  useEffect(() => {
    const stopListeningHover = listen<string[]>(
      // TODO Or DRAG_ENTER????
      TauriEvent.DRAG_OVER,
      (event) => {
        if (event.payload.length === 0) {
          return
        }

        setIsDraggingOver(true)
      },
    )

    const stopListeningCancelled = listen(TauriEvent.DRAG_LEAVE, () => {
      setIsDraggingOver(false)
    })

    const stopListeningDrop = listen<string[]>(
      TauriEvent.DRAG_DROP,
      (event) => {
        setIsDraggingOver(false)

        if (event.payload.length === 0) {
          return
        }

        callbackRef.current(event)
      },
    )

    return () => {
      // Returning a promise that resolves to a function which stops listening
      // isn't that ergonomic when used with React.
      stopListeningDrop.then((unlisten) => unlisten())
      stopListeningHover.then((unlisten) => unlisten())
      stopListeningCancelled.then((unlisten) => unlisten())
    }
  }, [callbackRef])

  return { isDraggingOver }
}

export default useTauriFileDrop
