import {
  type Middleware,
  createStore,
  type PreloadedState,
  compose,
  applyMiddleware,
  type AnyAction,
} from 'redux'
import { asyncMiddleware, sideEffectMiddleware } from 'redux-easy-mode'

import rootReducer from './rootReducer'

const middleware: Middleware[] = []

middleware.push(asyncMiddleware())
middleware.push(sideEffectMiddleware())

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
  }
}

const reduxDevToolsCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
const composeEnhancers =
  import.meta.env.DEV && reduxDevToolsCompose ? reduxDevToolsCompose : compose

function createRootStore(initialState?: PreloadedState<RootState>) {
  // Specify the types here to remove any issues the PreloadedState might cause.
  const store = createStore<RootState, AnyAction, unknown, unknown>(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middleware)),
  )

  if (import.meta.hot) {
    import.meta.hot.accept('./rootReducer', (mod) => {
      if (mod) {
        store.replaceReducer(mod.default)
      }
    })
  }

  return store
}

export default createRootStore
