import { combineReducers } from 'redux'

import * as sourcePorts from '@src/sourcePorts/reducer'

const rootReducer = combineReducers({
  sourcePorts: sourcePorts.reducer,
})

export default rootReducer
