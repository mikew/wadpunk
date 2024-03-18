import type { Middleware } from 'redux'
import { createStore, compose, applyMiddleware } from 'redux'
import { asyncMiddleware, sideEffectMiddleware } from 'redux-easy-mode'

// import failsafeMiddleware from './failsafeMiddleware'
import rootReducer from './rootReducer'

const middleware: Middleware[] = []

// if (typeof describe === 'function') {
//   middleware.push(failsafeMiddleware)
// }

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

function createRootStore(initialState?: Partial<RootState>) {
  // Specify the types here to remove any issues the PreloadedState might cause.
  const store = createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(...middleware)),
  )

  import.meta.hot?.accept('./rootReducer', (mod) => {
    if (mod) {
      store.replaceReducer(mod.default)
    }
  })

  return store
}

export default createRootStore
