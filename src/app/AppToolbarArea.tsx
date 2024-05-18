import createSlotPortal from '#src/lib/createSlotPortal'

export const {
  reactContext: appToolbarContext,
  SlotComponent: AppToolbarSlot,
  PortalComponent: AppToolbarPortal,
  PortalProvider: AppToolbarProvider,
} = createSlotPortal()
