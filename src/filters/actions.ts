import { createActions } from 'redux-easy-mode'

export default createActions('filters', {
  setCurrentFilter: (filter: string) => ({ filter }),
})
