import { createActions } from 'redux-easy-mode'

export default createActions('sourcePorts', {
  toggleDialog: () => {},
  setSelectedId: (id: string) => ({ id }),

  toggleKnownSourcePortsDialog: () => {},
  setSelectedKnownSourcePort: (args: {
    ids: string[]
    mode: 'exclusive' | 'toggle'
  }) => args,
})
