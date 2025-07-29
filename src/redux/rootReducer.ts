import { combineReducers } from 'redux'

import * as filters from '#src/filters/reducer'
import * as games from '#src/games/redux'
import * as sourcePorts from '#src/sourcePorts/reducer'

const rootReducer = combineReducers({
  filters: filters.reducer,
  sourcePorts: sourcePorts.reducer,
  games: games.reducer,
})

export default rootReducer
