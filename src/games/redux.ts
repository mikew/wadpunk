import { createActions, createReducer } from 'redux-easy-mode'

import type { Game } from '#src/graphql/types'

export const actions = createActions('games', {
  setSelectedId: (id: Game['id'] | undefined) => ({ id }),
})

export interface State {
  selectedId?: Game['id']
}

export const initialState: State = {}

export const reducer = createReducer(initialState, (builder) => {
  builder.addHandler(actions.setSelectedId, (state, action) => ({
    ...state,
    selectedId: action.payload.id,
  }))
})
