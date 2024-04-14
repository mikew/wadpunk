import { combineReducers } from 'redux'

import * as games from '#src/games/redux'
import * as sourcePorts from '#src/sourcePorts/reducer'

const rootReducer = combineReducers({
  sourcePorts: sourcePorts.reducer,
  games: games.reducer,
})

export default rootReducer
