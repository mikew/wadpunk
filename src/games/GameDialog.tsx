import { useMutation, useQuery } from '@apollo/client'
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  ModalClose,
  ModalDialog,
  Textarea,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Checkbox,
} from '@mui/joy'
import { forwardRef, useMemo } from 'react'

import {
  GetGameFilesDocument,
  UpdateNotesDocument,
} from '@src/graphql/operations'

import { type GameListGame } from './GameList'

const GameDialog = forwardRef<HTMLDivElement, { game: GameListGame }>(
  (props, ref) => {
    const iwad = 'Doom 2/'
    // const iwad = undefined

    const game_ids = useMemo(() => {
      const ids = [props.game.id]

      if (iwad) {
        ids.unshift(iwad)
      }

      return ids
    }, [iwad, props.game.id])

    const [updateNotes] = useMutation(UpdateNotesDocument)
    const { data: gameFiles } = useQuery(GetGameFilesDocument, {
      variables: {
        game_ids,
      },
    })

    return (
      <ModalDialog ref={ref}>
        <DialogTitle>
          {props.game.name}
          <ModalClose />
        </DialogTitle>

        <DialogContent>
          <Typography id="size-modal-description">
            {props.game.description}
          </Typography>

          <FormLabel>Files</FormLabel>
          <List size="sm" variant="outlined">
            {gameFiles?.getGameFiles.map((x) => {
              return (
                <ListItem key={x}>
                  <ListItemDecorator>
                    <Checkbox
                      size="sm"
                      checked={
                        x.toLowerCase().endsWith('.wad') ||
                        x.toLowerCase().endsWith('pk3') ||
                        x.toLowerCase().endsWith('.iwad')
                      }
                    />
                  </ListItemDecorator>
                  <ListItemContent>{x}</ListItemContent>
                </ListItem>
              )
            })}
          </List>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea minRows={2} value={props.game.notes} />
            {/* <FormHelperText>This is a helper text.</FormHelperText> */}
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button>Play</Button>

          <Button
            onClick={() => {
              updateNotes({
                variables: {
                  game_id: props.game.id,
                  notes: 'updated from UI',
                },
              })
            }}
            color="neutral"
          >
            Save
          </Button>
        </DialogActions>
      </ModalDialog>
    )
  },
)

export default GameDialog
