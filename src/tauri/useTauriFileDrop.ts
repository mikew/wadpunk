import { getCurrentWebview } from '@tauri-apps/api/webview'
import { useEffect, useState } from 'react'

import useLatest from '#src/lib/useLatest'

function useTauriFileDrop(
  callback: (event: {
    paths: string[]
    position: { x: number; y: number }
  }) => void,
) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const callbackRef = useLatest(callback)

  useEffect(() => {
    let listening = true
    let unlisten: (() => void) | undefined

    async function run() {
      unlisten = await getCurrentWebview().onDragDropEvent((event) => {
        if (!listening) {
          return
        }

        if (event.payload.type === 'enter') {
          if (event.payload.paths.length > 0) {
            setIsDraggingOver(true)
          }
          return
        }

        if (event.payload.type === 'leave') {
          setIsDraggingOver(false)
          return
        }

        if (event.payload.type === 'drop') {
          setIsDraggingOver(false)

          if (event.payload.paths.length > 0) {
            callbackRef.current({
              paths: event.payload.paths,
              position: event.payload.position,
            })
          }
          return
        }
      })
    }

    run()

    return () => {
      listening = false
      unlisten?.()
    }
  }, [callbackRef])

  return { isDraggingOver }
}

export default useTauriFileDrop
