import { combineReducers } from 'redux'

import * as games from '#src/games/redux'
import * as modSets from '#src/modSets/reducer'
import * as sourcePorts from '#src/sourcePorts/reducer'

const rootReducer = combineReducers({
  sourcePorts: sourcePorts.reducer,
  modSets: modSets.reducer,
  games: games.reducer,
})

export default rootReducer
