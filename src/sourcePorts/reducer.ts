import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  isDialogOpen: boolean
}

export const initialState: State = {
  isDialogOpen: false,
}

export const reducer = createReducer(initialState, (builder) => {
  builder.addHandler(actions.toggleDialog, (state, action) => ({
    ...state,
    isDialogOpen: !state.isDialogOpen,
  }))
})
