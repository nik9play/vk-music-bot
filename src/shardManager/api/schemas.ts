import { Static, Type } from '@sinclair/typebox'

export const PlayersOptions = Type.Object({
  action: Type.Union([Type.Literal('clear-queues'), Type.Literal('destroy-all')])
})

export type PlayersOptionsType = Static<typeof PlayersOptions>

export const NodeOptionRequest = Type.Object({
  name: Type.String(),
  url: Type.String(),
  auth: Type.String(),
  secure: Type.Optional(Type.Boolean()),
  group: Type.Optional(Type.Boolean())
})
export type NodeOptionRequestType = Static<typeof NodeOptionRequest>

export const NodeDelete = Type.Object({
  name: Type.String()
})
export type NodeDeleteType = Static<typeof NodeDelete>

export const PremiumUpdate = Type.Object({
  guildId: Type.String(),
  premium: Type.Boolean()
})
export type PremiumUpdateType = Static<typeof PremiumUpdate>
