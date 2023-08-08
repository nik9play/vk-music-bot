import { z } from 'zod'

const envSchema = z.object({
  LAVALINK_NODES: z.string(),
  DISCORD_TOKEN: z.string(),
  NODE_ENV: z.enum(['production', 'development']).default('development'),
  MONGO_URL: z.string(),
  REDIS_URL: z.string(),
  CAPTCHA_SOLVER_URL: z.string(),
  DISCORD_PROXY_URL: z.string().optional(),
  API_TOKEN: z.string(),
  DATMUSIC_URL: z.string(),
  SDC_TOKEN: z.string().optional(),
  BOTICORD_TOKEN: z.string().optional(),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .default('5000')
    .transform((val) => parseInt(val)),
  VK_TOTAL_SHARDS: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val)),
  SHARDS_PER_CLUSTER: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val)),
  CLIENT_ID: z.string(),
  INFLUX_URL: z.string(),
  INFLUX_TOKEN: z.string(),
  INFLUX_ORG: z.string(),
  INFLUX_BUCKET: z.string(),
  INDOMITABLE_CLUSTER_TOTAL: z.string().default('0'),
  INDOMITABLE_CLUSTER: z.string().default('0'),
  VK_PROXY_URL: z.string(),
  VK_PROXY_TOKEN: z.string(),
  LOKI_URL: z.string()
})

export function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error(
      `Check following env vars: ${result.error.errors.map((el) => el.path[0]).join(', ')}`
    )
    process.exit(-1)
  }
}
validateEnv()
export const ENV = envSchema.parse(process.env)
