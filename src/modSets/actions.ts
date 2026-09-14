import { createActions } from 'redux-easy-mode'

export default createActions('modSets', {
  toggleDialog: () => {},
  setSelectedName: (name: string) => ({ name }),
})