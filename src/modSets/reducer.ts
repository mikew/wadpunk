import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  isDialogOpen: boolean
  selectedName: string
}

export const initialState: State = {
  isDialogOpen: false,
  selectedName: '-1',
}

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addHandler(actions.toggleDialog, (state) => ({
      ...state,
      isDialogOpen: !state.isDialogOpen,
    }))
    .addHandler(actions.setSelectedName, (state, action) => ({
      ...state,
      selectedName: action.payload.name,
    }))
})
