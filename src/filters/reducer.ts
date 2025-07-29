import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  currentFilter: string
}

export const initialState: State = {
  currentFilter: 'default',
}

export const reducer = createReducer(initialState, (builder) => {
  builder.addHandler(actions.setCurrentFilter, (state, action) => ({
    ...state,
    currentFilter: action.payload.filter,
  }))
})
