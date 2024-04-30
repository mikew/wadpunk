import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  isDialogOpen: boolean
  selectedId: string
  isKnownSourcePortsDialogOpen: boolean
}

export const initialState: State = {
  isDialogOpen: false,
  selectedId: '-1',
  isKnownSourcePortsDialogOpen: false,
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
    .addHandler(actions.toggleKnownSourcePortsDialog, (state, action) => ({
      ...state,
      isKnownSourcePortsDialogOpen: !state.isKnownSourcePortsDialogOpen,
    }))
})
