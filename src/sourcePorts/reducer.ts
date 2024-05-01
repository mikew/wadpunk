import { createReducer } from 'redux-easy-mode'

import actions from './actions'

export interface State {
  isDialogOpen: boolean
  selectedId: string
  isKnownSourcePortsDialogOpen: boolean
  selectedKnownSourcePortIds: string[]
}

export const initialState: State = {
  isDialogOpen: false,
  selectedId: '-1',
  isKnownSourcePortsDialogOpen: false,
  selectedKnownSourcePortIds: [],
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
    .addHandler(actions.setSelectedKnownSourcePort, (state, action) => {
      const { ids, mode } = action.payload
      let selectedKnownSourcePortIds: string[] = []

      if (mode === 'exclusive') {
        selectedKnownSourcePortIds = [...ids]
      } else if (mode === 'toggle') {
        for (const id of ids) {
          if (state.selectedKnownSourcePortIds.includes(id)) {
            selectedKnownSourcePortIds =
              state.selectedKnownSourcePortIds.filter((x) => x !== id)
          } else {
            selectedKnownSourcePortIds = [
              ...state.selectedKnownSourcePortIds,
              id,
            ]
          }
        }
      }

      return {
        ...state,
        selectedKnownSourcePortIds,
      }
    })
})
