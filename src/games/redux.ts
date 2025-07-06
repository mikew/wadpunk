import { createActions, createReducer } from 'redux-easy-mode'

import type { Game } from '#src/graphql/types'

export type ImportQueueItem =
  | {
    action: 'import'
    filePath: string
  }
  | {
    action: 'download'
    host: string
    hint?: string | null
  }

export const actions = createActions('games', {
  setSelectedId: (id: Game['id'] | undefined) => ({ id }),

  addToImportQueue: (items: ImportQueueItem[]) => ({ items }),
  removeImportQueueItem: () => { },
})

export interface State {
  selectedId?: Game['id']

  importQueue: ImportQueueItem[]
  currentBatchTotal: number
  currentBatchProcessed: number
}

export const initialState: State = {
  importQueue: [],
  currentBatchTotal: 0,
  currentBatchProcessed: 0,
}

export const reducer = createReducer(initialState, (builder) => {
  builder.addHandler(actions.setSelectedId, (state, action) => ({
    ...state,
    selectedId: action.payload.id,
  }))

  builder.addHandler(actions.addToImportQueue, (state, action) => {
    const nextState = { ...state }

    if (nextState.currentBatchTotal === 0) {
      nextState.currentBatchProcessed = 0
    }

    nextState.currentBatchTotal += action.payload.items.length
    nextState.importQueue = [...state.importQueue, ...action.payload.items]

    return nextState
  })

  builder.addHandler(actions.removeImportQueueItem, (state) => {
    const nextState = { ...state }

    nextState.importQueue = state.importQueue.slice(1)

    nextState.currentBatchProcessed += 1

    if (nextState.importQueue.length === 0) {
      nextState.currentBatchTotal = 0
      nextState.currentBatchProcessed = 0
    }

    return nextState
  })
})
