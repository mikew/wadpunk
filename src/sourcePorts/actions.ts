import { createActions } from 'redux-easy-mode'

export default createActions('sourcePorts', {
  toggleDialog: () => {},
  setSelectedId: (id: string) => ({ id }),

  toggleKnownSourcePortsDialog: () => {},
  setSelectedKnownSourcePort: (id: string) => ({ id }),
})
