import { useSuspenseQuery } from '@apollo/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  Checkbox,
  FormLabel,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material'
import type { SwitchBaseProps } from '@mui/material/internal/SwitchBase'
import { useEffect } from 'react'
import { useWatch } from 'react-hook-form'

import { useI18nContext } from '#src/i18n/lib/i18nContext'

import type { GameDialogFormValues } from './GameDialog'
import type { FileEntry } from './GameFileListContext'
import { useGameFileListContext } from './GameFileListContext'
import isIwad from './isIwad'
import type { GetGameDialogFieldsQuery } from './operations.generated'
import { GetGameFilesDocument } from './operations.generated'

interface GameDialogFileListProps {
  previousFileState: GetGameDialogFieldsQuery['getGame']['previous_file_state']
}

// TODO:
// There's some issues with keeping this stuff in the form state.
// - The initial value is an empty array, so when the form is reset, the files
//   disappear.
// - We can't do the queries in the main component, because that would
//   reinitialize the form and lose any state the user has.
const GameDialogFileList: React.FC<GameDialogFileListProps> = (props) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const { setFiles, files, setEnabled } = useGameFileListContext()
  const gameId = useWatch<GameDialogFormValues, 'id'>({
    name: 'id',
  })
  const iwadIdValue = useWatch<GameDialogFormValues, 'iwadId'>({
    name: 'iwadId',
  })
  const tagsField = useWatch<GameDialogFormValues, 'tags'>({ name: 'tags' })
  const extraGameIdsField = useWatch<GameDialogFormValues, 'extraGameIds'>({
    name: 'extraGameIds',
  })
  const isGameIwad = isIwad(tagsField)
  const iwadId = isGameIwad ? gameId : iwadIdValue

  const allGameIds = (isGameIwad ? [] : [gameId]).concat(
    extraGameIdsField.map((x) => (typeof x === 'string' ? x : x.id)),
  )

  const { data: gameFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: allGameIds,
    },
    fetchPolicy: 'network-only',
  })

  const { data: iwadFiles } = useSuspenseQuery(GetGameFilesDocument, {
    variables: {
      game_ids: iwadId ? [iwadId] : [],
    },
    fetchPolicy: 'network-only',
  })

  const { t } = useI18nContext()

  useEffect(() => {
    const allFiles: FileEntry[] = [
      ...(iwadFiles.getGameFiles.map((x) => {
        const entry: FileEntry = {
          id: x.absolute,
          isIwad: true,
          absolute: x.absolute,
          relative: x.relative,
          selected:
            x.absolute.toLowerCase().endsWith('.wad') ||
            x.absolute.toLowerCase().endsWith('.iwad') ||
            x.absolute.toLowerCase().endsWith('.pwad') ||
            x.absolute.toLowerCase().endsWith('.pk3') ||
            x.absolute.toLowerCase().endsWith('.ipk3') ||
            x.absolute.toLowerCase().endsWith('.pk7') ||
            x.absolute.toLowerCase().endsWith('.pke') ||
            x.absolute.toLowerCase().endsWith('.deh') ||
            x.absolute.toLowerCase().endsWith('.bex'),
        }

        return entry
      }) || []),

      ...(gameFiles.getGameFiles.map((x) => {
        const previousEntry = props.previousFileState.find(
          (p) => p.relative === x.relative,
        )
        let isSelected: boolean | undefined = undefined

        if (previousEntry) {
          isSelected = previousEntry.is_enabled
        }

        if (isSelected == null) {
          isSelected =
            x.absolute.toLowerCase().endsWith('.wad') ||
            x.absolute.toLowerCase().endsWith('.iwad') ||
            x.absolute.toLowerCase().endsWith('.pwad') ||
            x.absolute.toLowerCase().endsWith('.pk3') ||
            x.absolute.toLowerCase().endsWith('.ipk3') ||
            x.absolute.toLowerCase().endsWith('.pk7') ||
            x.absolute.toLowerCase().endsWith('.pke') ||
            x.absolute.toLowerCase().endsWith('.deh') ||
            x.absolute.toLowerCase().endsWith('.bex')
        }

        const entry: FileEntry = {
          id: x.absolute,
          isIwad: false,
          absolute: x.absolute,
          relative: x.relative,
          selected: isSelected,
        }

        return entry
      }) || []),
    ]

    allFiles.sort((a, b) => {
      const indexA = props.previousFileState.findIndex(
        (x) => x.relative === a.relative,
      )
      const indexB = props.previousFileState.findIndex(
        (x) => x.relative === b.relative,
      )

      if (indexA == null || indexB == null) {
        return 0
      }

      return indexA - indexB
    })

    setFiles(allFiles)

    // Trigger a resize so the iwad / mods dropdowns reposition themselves.
    window.dispatchEvent(new Event('resize'))
  }, [
    gameFiles.getGameFiles,
    iwadFiles.getGameFiles,
    props.previousFileState,
    setFiles,
  ])

  return (
    <>
      <FormLabel>{t('games.fields.files.label')}</FormLabel>
      <DndContext
        onDragEnd={(event) => {
          const oldIndex = files.findIndex((x) => x.id === event.active.id)
          const newIndex = files.findIndex((x) =>
            event.over ? x.id === event.over.id : false,
          )

          if (oldIndex !== -1 && newIndex !== -1) {
            const newValue = arrayMove(files, oldIndex, newIndex)
            setFiles(newValue)
          }
        }}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
      >
        <List dense disablePadding component="div">
          <SortableContext items={files} strategy={verticalListSortingStrategy}>
            {files.map((x, i) => {
              return (
                <SortableItem
                  key={x.id}
                  file={x}
                  onCheckboxChange={(event, checked) => {
                    setEnabled(x.relative, checked)
                  }}
                />
              )
            })}
          </SortableContext>
        </List>
      </DndContext>
    </>
  )
}

interface SortableItemProps {
  file: FileEntry
  onCheckboxChange: SwitchBaseProps['onChange']
}

const SortableItem: React.FC<SortableItemProps> = (props) => {
  const theme = useTheme()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isSorting,
  } = useSortable({
    id: props.file.id,
    transition: {
      duration: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.sharp,
    },
  })

  return (
    <ListItem
      ref={setNodeRef}
      disableGutters
      disablePadding
      {...attributes}
      {...listeners}
      component="div"
      sx={{
        cursor: isSorting ? 'grabbing' : 'grab',
        transition,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <Checkbox
        size="small"
        checked={props.file.isIwad ? true : props.file.selected}
        onChange={props.onCheckboxChange}
        disabled={props.file.isIwad}
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
      />
      <ListItemText
        primary={props.file.relative}
        primaryTypographyProps={{
          color: props.file.selected ? undefined : 'text.secondary',
        }}
      />
    </ListItem>
  )
}

export default GameDialogFileList
