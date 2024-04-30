import type { GetAllSourcePortsQuery } from '#src/graphql/operations'

export type SourcePortListSourcePort = ArrayItemType<
  GetAllSourcePortsQuery['getSourcePorts']
>

export type KnownSourcePortListItem = ArrayItemType<
  GetAllSourcePortsQuery['getKnownSourcePorts']
>
