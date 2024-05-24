import type { GetAllSourcePortsQuery } from './operations.generated'

export type SourcePortListSourcePort = ArrayItemType<
  GetAllSourcePortsQuery['getSourcePorts']
>

export type KnownSourcePortListItem = ArrayItemType<
  GetAllSourcePortsQuery['getKnownSourcePorts']
>
