import { Static, Type } from '@sinclair/typebox'

export const ReclusterOptions = Type.Object({
  mode: Type.Union([Type.Literal('gracefulSwitch'), Type.Literal('rolling')])
})

export type ReclusterOptionsType = Static<typeof ReclusterOptions>
