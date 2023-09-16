import { useMutation } from '@apollo/client'
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  ModalClose,
  ModalDialog,
  Textarea,
  Typography,
} from '@mui/joy'
import { UpdateNotesDocument } from '@src/graphql/operations'
import { forwardRef } from 'react'
import { type GameListGame } from './GameList'

const GameDialog = forwardRef<HTMLDivElement, { game: GameListGame }>(
  (props, ref) => {
    const [updateNotes] = useMutation(UpdateNotesDocument)

    return (
      <ModalDialog
        aria-labelledby="size-modal-title"
        aria-describedby="size-modal-description"
        size="sm"
        ref={ref}
      >
        <ModalClose />

        <Typography id="size-modal-title" level="h2">
          {props.game.name}
        </Typography>

        <Typography id="size-modal-description">
          {props.game.description}
        </Typography>

        <FormControl>
          <FormLabel>Notes</FormLabel>
          <Textarea minRows={2} value={props.game.notes} />
          <FormHelperText>This is a helper text.</FormHelperText>
        </FormControl>

        <Button
          onClick={() => {
            updateNotes({
              variables: {
                game_id: props.game.id,
                notes: 'updated from UI',
              },
            })
          }}
        >
          Save
        </Button>
      </ModalDialog>
    )
  },
)

export default GameDialog
