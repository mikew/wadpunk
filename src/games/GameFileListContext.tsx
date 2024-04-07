import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export interface FileEntry {
  isIwad: boolean
  absolute: string
  relative: string
  selected: boolean
  // TODO This only exists for dnd-kit. Maybe move it to the server and have it
  // be `${ABSOLUTE}`
  id: string
}

export interface GameFileListContextType {
  files: FileEntry[]
  setFiles: (files: FileEntry[]) => void
  setEnabled: (relativePath: string, isEnabled: boolean) => void
}

export const GameFileListContext =
  createContext<GameFileListContextType | null>(null)

export function useGameFileListContext() {
  const context = useContext(GameFileListContext)

  if (!context) {
    throw new Error(
      'Cannot useGameFileListContext outside of GameFileListContext',
    )
  }

  return context
}

export const GameFileListProvider: React.FC<PropsWithChildren> = (props) => {
  const [files, setFiles] = useState<FileEntry[]>([])

  const setEnabled = useCallback((relativePath: string, isEnabled: boolean) => {
    setFiles((prev) => {
      const newValue = [...prev]

      for (const file of newValue) {
        if (file.relative === relativePath) {
          file.selected = isEnabled
        }
      }

      return newValue
    })
  }, [])

  const contextValue = useMemo(() => {
    const contextValue: GameFileListContextType = {
      files,
      setFiles,
      setEnabled,
    }

    return contextValue
  }, [files, setEnabled])

  return (
    <GameFileListContext.Provider value={contextValue}>
      {props.children}
    </GameFileListContext.Provider>
  )
}
