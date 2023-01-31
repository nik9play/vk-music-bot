import { Static, Type } from '@sinclair/typebox'

export const PlayersOptions = Type.Object({
  action: Type.Union([Type.Literal('clear-queues'), Type.Literal('destroy-all')])
})

export type PlayersOptionsType = Static<typeof PlayersOptions>
