import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  isDialogOpen: boolean
  selectedId: string
}

export const initialState: State = {
  isDialogOpen: false,
  selectedId: '-1',
}

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addHandler(actions.toggleDialog, (state, action) => ({
      ...state,
      isDialogOpen: !state.isDialogOpen,
    }))
    .addHandler(actions.setSelectedId, (state, action) => ({
      ...state,
      selectedId: action.payload.id,
    }))
})
